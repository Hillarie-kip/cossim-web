/**
 * Example component demonstrating how to use the new API system
 * This shows best practices for making authenticated API calls
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useAPI } from '@/hooks/useAPI'
import { useAuth } from '@/contexts/AuthContext'
import apiRoutes from '@/constants/apis'

const ExampleAPIUsage = () => {
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState({ name: '', email: '' })
  const { user } = useAuth()
  const { get, post, put, delete: del, loading, error } = useAPI()

  // Example: Fetch data on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const data = await get(apiRoutes.users.list, {
        showLoading: true,
        showError: true
      })
      setUsers(data)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
  }

  // Example: Create new user
  const handleCreateUser = async (e) => {
    e.preventDefault()
    
    try {
      const newUser = await post(apiRoutes.users.create, formData, {
        showLoading: true,
        showError: true,
        showSuccess: true,
        successMessage: 'User created successfully!',
        onSuccess: (data) => {
          setUsers(prev => [...prev, data])
          setFormData({ name: '', email: '' })
        }
      })
    } catch (err) {
      console.error('Failed to create user:', err)
    }
  }

  // Example: Update user
  const handleUpdateUser = async (userId, updates) => {
    try {
      const updatedUser = await put(apiRoutes.users.update(userId), updates, {
        showLoading: true,
        showError: true,
        showSuccess: true,
        successMessage: 'User updated successfully!',
        onSuccess: (data) => {
          setUsers(prev => prev.map(u => u.id === userId ? data : u))
        }
      })
    } catch (err) {
      console.error('Failed to update user:', err)
    }
  }

  // Example: Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    try {
      await del(apiRoutes.users.delete(userId), {
        showLoading: true,
        showError: true,
        showSuccess: true,
        successMessage: 'User deleted successfully!',
        onSuccess: () => {
          setUsers(prev => prev.filter(u => u.id !== userId))
        }
      })
    } catch (err) {
      console.error('Failed to delete user:', err)
    }
  }

  // Example: Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      const stats = await get(apiRoutes.dashboard.stats, {
        showLoading: false, // Don't show loading for background requests
        showError: true
      })
      console.log('Dashboard stats:', stats)
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err)
    }
  }

  return (
    <div className="container-fluid">
      <div className="page-header">
        <div className="row">
          <div className="col-sm-12">
            <h3 className="page-title">API Usage Example</h3>
            <ul className="breadcrumb">
              <li className="breadcrumb-item"><a href="#">Dashboard</a></li>
              <li className="breadcrumb-item active">API Example</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Create User</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateUser}>
                <div className="form-group mb-3">
                  <label>Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Users List</h4>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={fetchUsers}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
            <div className="card-body">
              {loading && <div className="text-center">Loading...</div>}
              {error && <div className="alert alert-danger">{error}</div>}
              
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-outline-info me-2"
                            onClick={() => handleUpdateUser(user.id, { status: 'active' })}
                          >
                            Update
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Current User Info</h4>
            </div>
            <div className="card-body">
              <p><strong>Authenticated:</strong> {user ? 'Yes' : 'No'}</p>
              {user && (
                <>
                  <p><strong>User ID:</strong> {user.UserId}</p>
                  <p><strong>Username:</strong> {user.Username}</p>
                  <p><strong>Token Present:</strong> {user.UserToken ? 'Yes' : 'No'}</p>
                </>
              )}
              
              <button 
                className="btn btn-info mt-2"
                onClick={fetchDashboardStats}
              >
                Fetch Dashboard Stats
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExampleAPIUsage
