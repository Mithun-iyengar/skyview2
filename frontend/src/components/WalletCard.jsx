import React, { useState, useEffect } from 'react'
import { walletApi } from '../utils/apiService'

export default function WalletCard({ onToast }) {
  const [walletBalance, setWalletBalance] = useState(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadWalletBalance()
  }, [])

  const loadWalletBalance = async () => {
    try {
      setLoading(true)
      const response = await walletApi.getBalance()
      setWalletBalance(response.balance || 0)
    } catch (error) {
      console.error('Failed to load wallet balance:', error)
      setWalletBalance(0)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMoney = async () => {
    const numAmount = parseFloat(amount)

    // Validation
    if (!amount || numAmount <= 0) {
      onToast({ message: 'Please enter a valid amount', type: 'error' })
      return
    }

    try {
      setAdding(true)
      const response = await walletApi.addMoney(numAmount)
      
      // Update displayed balance
      setWalletBalance(response.balance || 0)

      // Notify the header/navbar to refresh the wallet display immediately
      window.dispatchEvent(new Event('walletUpdated'))
      
      // Clear input
      setAmount('')
      
      // Show success message
      onToast({ 
        message: `₹${numAmount.toFixed(2)} added to wallet successfully`, 
        type: 'success' 
      })
    } catch (error) {
      const errorMessage = error.message || 'Failed to add money to wallet'
      onToast({ message: errorMessage, type: 'error' })
      console.error('Error adding money:', error)
    } finally {
      setAdding(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddMoney()
    }
  }

  const displayBalance = walletBalance !== null ? walletBalance.toFixed(2) : '0.00'

  return (
    <div className="wallet-card">
      <div className="wallet-header">
        <h3 className="wallet-title">💳 My Wallet</h3>
      </div>

      <div className="wallet-content">
        {/* Balance Display */}
        <div className="wallet-balance">
          <span className="balance-label">Current Balance:</span>
          {loading ? (
            <span className="balance-amount loading">Loading...</span>
          ) : (
            <span className="balance-amount">₹{displayBalance}</span>
          )}
        </div>

        {/* Add Money Section */}
        <div className="add-money-section">
          <input
            type="number"
            className="wallet-input"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={adding}
            step="0.01"
            min="0"
          />
          <button
            className="wallet-btn btn-primary"
            onClick={handleAddMoney}
            disabled={adding || loading}
          >
            {adding ? 'Adding...' : 'Add Money'}
          </button>
        </div>
      </div>
    </div>
  )
}
