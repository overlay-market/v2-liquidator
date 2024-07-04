// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@overlay-protocol/v1-core/contracts/interfaces/IOverlayV1Market.sol";

interface IOverlayV1PositionState {
    function liquidatable(
        IOverlayV1Market market,
        address owner,
        uint256 id
    ) external view returns (bool liquidatable_);
}

contract MultiCallLiquidatable {
    struct LiquidatableCall {
        IOverlayV1Market market;
        address owner;
        uint256 id;
    }

    function multiCallLiquidatable(
        address positionStateContract,
        LiquidatableCall[] memory calls
    ) 
        public 
        view 
        returns (bool[] memory results) 
    {
        require(positionStateContract != address(0), "Invalid position state contract address");
        require(calls.length > 0, "Calls array cannot be empty");

        IOverlayV1PositionState positionState = IOverlayV1PositionState(positionStateContract);
        results = new bool[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            results[i] = positionState.liquidatable(
                calls[i].market, 
                calls[i].owner, 
                calls[i].id
            );
        }
    }
}
