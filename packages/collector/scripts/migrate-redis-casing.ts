import redis from '../src/redisHandler'
import chalk from 'chalk'

async function migrate() {
    console.log(chalk.blue('Starting Redis key casing migration...'))

    console.log(chalk.yellow('Triggering Redis SAVE for backup...'))
    try {
        await redis.save()
        console.log(chalk.green('Backup saved successfully.'))
    } catch (err) {
        console.warn(chalk.bold.red('Warning: Redis SAVE failed. This might be expected on some managed services, but Proceeding with caution...'), err)
    }

    const patterns = [
        'positions:*',
        'position_index:*',
        'latest_block_processed:*',
        'retry:*',
        'liquidatable_positions_found:*',
        'total_liquidated_positions:*',
        'liquidated_positions:*',
        'current-index:*',
        'ov_balance:*',
        'total_liquidated_positions_by_executor:*',
        'liquidated_positions_by_executor:*'
    ]

    let migratedCount = 0

    for (const pattern of patterns) {
        console.log(chalk.gray(`Scanning pattern: ${pattern}`))
        const keys = await redis.keys(pattern)

        for (const key of keys) {
            const lowerKey = key.toLowerCase()
            if (key !== lowerKey) {
                try {
                    const result = await redis.renamenx(key, lowerKey)
                    if (result === 1) {
                        console.log(chalk.green(`  Renamed: ${key} -> ${lowerKey}`))
                        migratedCount++
                    } else {
                        console.log(chalk.bold.red(`  COLLISION: ${lowerKey} already exists. Skipping rename for ${key}.`))
                        console.log(chalk.gray(`  (Manually merge data if necessary)`))
                    }
                } catch (err) {
                    console.log(chalk.red(`  Failed to rename ${key}: ${err}`))
                }
            }
        }
    }

    console.log(chalk.gray('Scanning set: unique_positions'))
    const members = await redis.smembers('unique_positions')
    for (const member of members) {
        const lowerMember = member.toLowerCase()
        if (member !== lowerMember) {
            console.log(chalk.yellow(`  Normalizing set member: ${member} -> ${lowerMember}`))
            try {
                // Remove old, add new in a transaction
                const pipeline = redis.pipeline()
                pipeline.srem('unique_positions', member)
                pipeline.sadd('unique_positions', lowerMember)
                await pipeline.exec()
                migratedCount++
            } catch (err) {
                console.log(chalk.red(`  Failed to normalize set member ${member}: ${err}`))
            }
        }
    }

    console.log(chalk.bold.green(`Migration complete. Migrated ${migratedCount} items.`))
    process.exit(0)
}

migrate().catch(err => {
    console.error(chalk.bold.red('Migration failed:'), err)
    process.exit(1)
})
