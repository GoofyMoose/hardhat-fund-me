// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

// Here we could copy/paste code from a real chainlink contract,
// however, sometimes they have dependencies, which can make things complicated
// Note: Chainlink actually built their own mock contracts
// Instead of copy/pasting the code of mock contracts, we can import them

import "@chainlink/contracts/src/v0.6/tests/MockV3Aggregator.sol";
