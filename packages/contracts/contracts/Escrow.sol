// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * AgentPay Escrow Contract
 * Escrow-based payment flow for AI agent marketplace.
 * Buyer deposits funds → seller delivers → buyer confirms → funds released to seller.
 * Supports dispute opening and automatic refund after deadline.
 */
contract AgentPayEscrow {
    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;
        bytes32 resourceId;
        EscrowStatus status;
        uint256 createdAt;
        uint256 deadline;
    }

    enum EscrowStatus { Pending, Delivered, Released, Refunded, Disputed }

    mapping(uint256 => Escrow) public escrows;
    uint256 public escrowCount;

    event EscrowCreated(uint256 indexed escrowId, address buyer, address seller, uint256 amount, bytes32 resourceId);
    event DeliveryConfirmed(uint256 indexed escrowId);
    event PaymentReleased(uint256 indexed escrowId, address seller, uint256 amount);
    event PaymentRefunded(uint256 indexed escrowId, address buyer, uint256 amount);
    event DisputeOpened(uint256 indexed escrowId);

    /**
     * Create a new escrow with ETH deposit.
     * @param seller Address of the seller
     * @param resourceId Bytes32 identifier for the purchased resource
     */
    function createEscrow(address seller, bytes32 resourceId) external payable returns (uint256) {
        require(msg.value > 0, "Must send ETH");
        require(seller != address(0), "Invalid seller address");

        uint256 escrowId = escrowCount++;
        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            resourceId: resourceId,
            status: EscrowStatus.Pending,
            createdAt: block.timestamp,
            deadline: block.timestamp + 24 hours
        });

        emit EscrowCreated(escrowId, msg.sender, seller, msg.value, resourceId);
        return escrowId;
    }

    /**
     * Buyer confirms delivery of the resource.
     */
    function confirmDelivery(uint256 escrowId) external {
        Escrow storage e = escrows[escrowId];
        require(e.status == EscrowStatus.Pending, "Not pending");
        require(msg.sender == e.buyer, "Only buyer can confirm");
        e.status = EscrowStatus.Delivered;
        emit DeliveryConfirmed(escrowId);
    }

    /**
     * Release payment to seller after delivery confirmation.
     * Can be called by anyone after the escrow is in Delivered state.
     */
    function releasePayment(uint256 escrowId) external {
        Escrow storage e = escrows[escrowId];
        require(e.status == EscrowStatus.Delivered, "Not delivered");
        e.status = EscrowStatus.Released;

        (bool success, ) = e.seller.call{value: e.amount}("");
        require(success, "Transfer failed");

        emit PaymentReleased(escrowId, e.seller, e.amount);
    }

    /**
     * Refund buyer if deadline passed or dispute resolved in buyer's favor.
     */
    function refundBuyer(uint256 escrowId) external {
        Escrow storage e = escrows[escrowId];
        require(
            e.status == EscrowStatus.Pending || e.status == EscrowStatus.Disputed,
            "Cannot refund"
        );
        require(
            block.timestamp > e.deadline || e.status == EscrowStatus.Disputed,
            "Not expired or disputed"
        );

        e.status = EscrowStatus.Refunded;
        (bool success, ) = e.buyer.call{value: e.amount}("");
        require(success, "Transfer failed");

        emit PaymentRefunded(escrowId, e.buyer, e.amount);
    }

    /**
     * Open a dispute — can be called by either buyer or seller.
     */
    function openDispute(uint256 escrowId) external {
        Escrow storage e = escrows[escrowId];
        require(e.status == EscrowStatus.Pending, "Not pending");
        require(msg.sender == e.buyer || msg.sender == e.seller, "Not a party");
        e.status = EscrowStatus.Disputed;
        emit DisputeOpened(escrowId);
    }

    /**
     * Get escrow details by ID.
     */
    function getEscrow(uint256 escrowId) external view returns (
        address buyer,
        address seller,
        uint256 amount,
        bytes32 resourceId,
        EscrowStatus status,
        uint256 createdAt,
        uint256 deadline
    ) {
        Escrow storage e = escrows[escrowId];
        return (e.buyer, e.seller, e.amount, e.resourceId, e.status, e.createdAt, e.deadline);
    }
}
