
const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    pipeline: jest.fn().mockReturnValue({
        hset: jest.fn(),
        zadd: jest.fn(),
        hdel: jest.fn(),
        zrem: jest.fn(),
        exec: jest.fn().mockResolvedValue([]),
        set: jest.fn(),
    }),
};

jest.mock('./redisHandler', () => ({
    __esModule: true,
    default: mockRedis,
}));

const mockSend = jest.fn().mockResolvedValue([]);
const mockGetBlockNumber = jest.fn().mockResolvedValue(100);
const mockFormatter = {
    filterLog: jest.fn().mockImplementation(l => l),
};

jest.mock('ethers', () => {
    const original = jest.requireActual('ethers');
    return {
        ...original,
        ethers: {
            ...original.ethers,
            providers: {
                JsonRpcProvider: jest.fn().mockImplementation(() => ({
                    getBlockNumber: mockGetBlockNumber,
                    send: mockSend,
                    formatter: mockFormatter,
                })),
                JsonRpcBatchProvider: jest.fn().mockImplementation(() => ({
                    getBlockNumber: mockGetBlockNumber,
                    send: mockSend,
                    formatter: mockFormatter,
                })),
                StaticJsonRpcProvider: jest.fn().mockImplementation(() => ({
                    getBlockNumber: mockGetBlockNumber,
                    send: mockSend,
                    formatter: mockFormatter,
                })),
            },
            utils: {
                ...original.ethers.utils,
                Interface: jest.fn().mockImplementation(() => ({
                    parseLog: jest.fn().mockReturnValue({ name: 'Build', args: ['0x1', '1', '1'] }),
                    getEventTopic: jest.fn().mockImplementation(name => `0x_topic_${name}`),
                })),
            },
        },
    };
});

import { __test } from './marketEventHandler';
import { Networks } from './constants';
import redis from './redisHandler';

describe('marketEventHandler batching', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('fetchEvents batches multiple markets into a single getLogs call', async () => {
        // Setup redis to return different last processed blocks for markets
        mockRedis.get.mockImplementation((key: string) => {
            if (key.includes('0x5Ec437121a47B86B40FdF1aB4eF95806e60a9247'.toLowerCase())) return Promise.resolve('50');
            if (key.includes('0x809E3b60cFb68d617e75ccCc8B15336dB7bAEB06'.toLowerCase())) return Promise.resolve('60');
            return Promise.resolve(null);
        });

        mockGetBlockNumber.mockResolvedValue(110);

        // Call fetchEvents for BSC_MAINNET
        await __test.fetchEvents(Networks.BSC_MAINNET, 'http://localhost:8545');

        // Verify getLogs was called
        // Based on logic: 
        // Global start block will be min(50+1, 60+1, init_blocks...)
        // Let's assume global start is 51.
        // blockStep is 1000. So one range from 51 to 110.

        expect(mockSend).toHaveBeenCalledTimes(2);

        // Call 1: Range 51-60, only Market A
        const call1 = mockSend.mock.calls[0][1][0];
        expect(call1.fromBlock).toBe('0x33'); // hex for 51
        expect(call1.toBlock).toBe('0x3c');   // hex for 60
        expect(call1.address).toContain('0x5Ec437121a47B86B40FdF1aB4eF95806e60a9247');
        expect(call1.address).not.toContain('0x809E3b60cFb68d617e75ccCc8B15336dB7bAEB06');

        // Call 2: Range 61-110, Market A and B
        const call2 = mockSend.mock.calls[1][1][0];
        expect(call2.fromBlock).toBe('0x3d'); // hex for 61
        expect(call2.toBlock).toBe('0x6e');   // hex for 110
        expect(call2.address).toContain('0x5Ec437121a47B86B40FdF1aB4eF95806e60a9247');
        expect(call2.address).toContain('0x809E3b60cFb68d617e75ccCc8B15336dB7bAEB06');
    });

    test('fetchEvents only queries markets relevant to the current block range', async () => {
        // Market A last processed 50, Market B last processed 200, Latest block 250, blockStep 100
        mockRedis.get.mockImplementation((key: string) => {
            if (key.includes('0x5Ec437121a47B86B40FdF1aB4eF95806e60a9247'.toLowerCase())) return Promise.resolve('50');
            if (key.includes('0x809E3b60cFb68d617e75ccCc8B15336dB7bAEB06'.toLowerCase())) return Promise.resolve('200');
            return Promise.resolve('100000000'); // Other markets far ahead
        });

        mockGetBlockNumber.mockResolvedValue(250);

        // Temporarily override blockStep for this test if needed, but it's 1000 in constants.
        // To test range filtering, I might need to mock networksConfig or just use a larger range.
        // Actually, BSC_MAINNET has blockStep 1000. 
        // If I want to see Market B NOT being queried in the first range, I need the first range to end before 201.
        // Range 1: 51 to 250 (since blockStep is 1000). 
        // Both 51 and 201 are <= 250, so both would be queried.

        // Let's mock networksConfig blockStep to a smaller value if possible
        // But it's a const. I'll just use the logic and verified addresses.

        await __test.fetchEvents(Networks.BSC_MAINNET, 'http://localhost:8545');

        expect(mockSend).toHaveBeenCalled();
        // In range 51-200, only Market A should be queried
        // In range 201-250, Market A and B should be queried

        const calls = mockSend.mock.calls;
        const callForRange51_200 = calls.find(c => c[1][0].fromBlock === '0x33');
        expect(callForRange51_200[1][0].address).toContain('0x5Ec437121a47B86B40FdF1aB4eF95806e60a9247');
        expect(callForRange51_200[1][0].address).not.toContain('0x809E3b60cFb68d617e75ccCc8B15336dB7bAEB06');

        const callForRange201_250 = calls.find(c => c[1][0].fromBlock === '0xc9'); // hex for 201
        expect(callForRange201_250[1][0].address).toContain('0x5Ec437121a47B86B40FdF1aB4eF95806e60a9247');
        expect(callForRange201_250[1][0].address).toContain('0x809E3b60cFb68d617e75ccCc8B15336dB7bAEB06');
    });
});
