import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings, 
  Crown, 
  Eye, 
  Edit, 
  Trash2, 
  Share, 
  Copy,
  Clock,
  Activity,
  Globe,
  Lock,
  UserCheck,
  UserX,
  Mail,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Star,
  MessageSquare,
  GitBranch,
  History,
  Bell,
  Download,
  Upload
} from 'lucide-react'
import { useWorkflowStore } from '@/store/workflow-store'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'

// Types for collaboration system
interface User {
  _id: string
  _uid: string
  email: string
  name: string
  avatar?: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  status: 'active' | 'invited' | 'inactive'
  lastActive: string
  permissions: UserPermissions
  joinedAt: string
  invitedBy?: string
}

interface UserPermissions {
  workflows: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    share: boolean
    execute: boolean
  }
  agents: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    configure: boolean
  }
  collaboration: {
    invite: boolean
    manage: boolean
    export: boolean
  }
  admin: {
    manageUsers: boolean
    manageRoles: boolean
    viewAnalytics: boolean
    systemSettings: boolean
  }
}

interface Workspace {
  _id: string
  name: string
  description: string
  owner: string
  members: string[]
  settings: WorkspaceSettings
  createdAt: string
  updatedAt: string
}

interface WorkspaceSettings {
  visibility: 'private' | 'team' | 'public'
  invitePolicy: 'owner' | 'admin' | 'anyone'
  defaultRole: 'viewer' | 'editor'
  allowGuestAccess: boolean
  requireApproval: boolean
  enableComments: boolean
  enableVersioning: boolean
}

interface Invitation {
  _id: string
  email: string
  role: string
  workspace: string
  invitedBy: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  expiresAt: string
  createdAt: string
  message?: string
}

interface Activity {
  _id: string
  user: string
  action: string
  target: string
  targetId: string
  details: Record<string, any>
  timestamp: string
}

// Role definitions with permissions
const ROLE_DEFINITIONS = {
  owner: {
    name: 'Owner',
    description: 'Full access to all features and settings',
    color: 'bg-orange-500',
    permissions: {
      workflows: { create: true, read: true, update: true, delete: true, share: true, execute: true },
      agents: { create: true, read: true, update: true, delete: true, configure: true },
      collaboration: { invite: true, manage: true, export: true },
      admin: { manageUsers: true, manageRoles: true, viewAnalytics: true, systemSettings: true }
    }
  },
  admin: {
    name: 'Administrator',
    description: 'Manage users and workflows, no system settings',
    color: 'bg-purple-500',
    permissions: {
      workflows: { create: true, read: true, update: true, delete: true, share: true, execute: true },
      agents: { create: true, read: true, update: true, delete: true, configure: true },
      collaboration: { invite: true, manage: true, export: true },
      admin: { manageUsers: true, manageRoles: true, viewAnalytics: true, systemSettings: false }
    }
  },
  editor: {
    name: 'Editor',
    description: 'Create and edit workflows and agents',
    color: 'bg-blue-500',
    permissions: {
      workflows: { create: true, read: true, update: true, delete: false, share: true, execute: true },
      agents: { create: true, read: true, update: true, delete: false, configure: true },
      collaboration: { invite: false, manage: false, export: true },
      admin: { manageUsers: false, manageRoles: false, viewAnalytics: true, systemSettings: false }
    }
  },
  viewer: {
    name: 'Viewer',
    description: 'View and execute workflows only',
    color: 'bg-green-500',
    permissions: {
      workflows: { create: false, read: true, update: false, delete: false, share: false, execute: true },
      agents: { create: false, read: true, update: false, delete: false, configure: false },
      collaboration: { invite: false, manage: false, export: false },
      admin: { manageUsers: false, manageRoles: false, viewAnalytics: false, systemSettings: false }
    }
  }
} as const

export function CollaborationSystem() {
  const { user } = useAuthStore()
  const { workflows } = useWorkflowStore()
  const { toast } = useToast()
  
  // State management
  const [activeTab, setActiveTab] = useState('team')
  const [users, setUsers] = useState<User[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Form states
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'viewer',
    message: ''
  })

  // Load collaboration data
  useEffect(() => {
    loadCollaborationData()
  }, [])

  const loadCollaborationData = async () => {
    setLoading(true)
    try {
      // Simulate loading collaboration data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data for demonstration
      setUsers([
        {
          _id: '1',
          _uid: user?.uid || '',
          email: user?.email || '',
          name: 'Current User',
          role: 'owner',
          status: 'active',
          lastActive: new Date().toISOString(),
          permissions: ROLE_DEFINITIONS.owner.permissions,
          joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '2',
          _uid: 'user2',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          status: 'active',
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          permissions: ROLE_DEFINITIONS.admin.permissions,
          joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          invitedBy: '1'
        },
        {
          _id: '3',
          _uid: 'user3',
          email: 'editor@example.com',
          name: 'Editor User',
          role: 'editor',
          status: 'active',
          lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          permissions: ROLE_DEFINITIONS.editor.permissions,
          joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          invitedBy: '1'
        }
      ])

      setInvitations([
        {
          _id: '1',
          email: 'pending@example.com',
          role: 'viewer',
          workspace: 'main',
          invitedBy: '1',
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'Welcome to our Claude Agent workspace!'
        }
      ])

      setActivities([
        {
          _id: '1',
          user: '2',
          action: 'created_workflow',
          target: 'workflow',
          targetId: 'wf1',
          details: { name: 'Customer Support Agent' },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '2',
          user: '3',
          action: 'updated_agent',
          target: 'agent',
          targetId: 'ag1',
          details: { name: 'Data Processor', changes: ['system_prompt', 'tools'] },
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ])

      setWorkspace({
        _id: 'main',
        name: 'Main Workspace',
        description: 'Primary workspace for Claude Agent development',
        owner: '1',
        members: ['1', '2', '3'],
        settings: {
          visibility: 'private',
          invitePolicy: 'admin',
          defaultRole: 'viewer',
          allowGuestAccess: false,
          requireApproval: true,
          enableComments: true,
          enableVersioning: true
        },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load collaboration data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteForm.email || !inviteForm.role) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newInvitation: Invitation = {
        _id: Date.now().toString(),
        email: inviteForm.email,
        role: inviteForm.role,
        workspace: workspace?._id || 'main',
        invitedBy: user?.uid || '',
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        message: inviteForm.message
      }

      setInvitations([...invitations, newInvitation])
      setInviteForm({ email: '', role: 'viewer', message: '' })
      setInviteDialogOpen(false)

      toast({
        title: 'Invitation Sent',
        description: `Invitation sent to ${inviteForm.email}`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      setUsers(users.map(u => 
        u._id === userId 
          ? { ...u, role: newRole as any, permissions: ROLE_DEFINITIONS[newRole as keyof typeof ROLE_DEFINITIONS].permissions }
          : u
      ))

      toast({
        title: 'Role Updated',
        description: 'User role has been successfully updated'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    try {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      setUsers(users.filter(u => u._id !== userId))

      toast({
        title: 'User Removed',
        description: 'User has been removed from the workspace'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove user',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResendInvitation = async (inviteId: string) => {
    try {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 500))

      toast({
        title: 'Invitation Resent',
        description: 'Invitation has been sent again'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend invitation',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeInvitation = async (inviteId: string) => {
    try {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 500))

      setInvitations(invitations.filter(inv => inv._id !== inviteId))

      toast({
        title: 'Invitation Revoked',
        description: 'Invitation has been revoked'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke invitation',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'invited': return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Invited</Badge>
      case 'inactive': return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>
      case 'pending': return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'expired': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    const roleInfo = ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]
    if (!roleInfo) return <Badge variant="outline">{role}</Badge>

    return (
      <Badge className={`${roleInfo.color} text-white`}>
        {role === 'owner' && <Crown className="w-3 h-3 mr-1" />}
        {role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
        {role === 'editor' && <Edit className="w-3 h-3 mr-1" />}
        {role === 'viewer' && <Eye className="w-3 h-3 mr-1" />}
        {roleInfo.name}
      </Badge>
    )
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Collaboration</h2>
          <p className="text-muted-foreground">
            Manage team members, roles, and workspace settings
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your workspace
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="message">Welcome Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Add a personal welcome message..."
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteUser} disabled={loading}>
                    {loading ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="team" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Team</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Invitations</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Roles</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Activity</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Team Management */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Team Members</span>
                <Badge variant="secondary">{users.length}</Badge>
              </CardTitle>
              <CardDescription>
                Manage team members, their roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search team members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Team Members Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((teamUser) => (
                      <TableRow key={teamUser._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={teamUser.avatar} />
                              <AvatarFallback>
                                {teamUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{teamUser.name}</div>
                              <div className="text-sm text-muted-foreground">{teamUser.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(teamUser.role)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(teamUser.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatTimeAgo(teamUser.lastActive)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatTimeAgo(teamUser.joinedAt)}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {teamUser.role !== 'owner' && (
                              <Select
                                value={teamUser.role}
                                onValueChange={(value) => handleUpdateUserRole(teamUser._id, value)}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                  <SelectItem value="editor">Editor</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {teamUser._uid !== user?.uid && teamUser.role !== 'owner' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveUser(teamUser._id)}
                              >
                                <UserX className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Management */}
        <TabsContent value="invitations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Pending Invitations</span>
                <Badge variant="secondary">{invitations.length}</Badge>
              </CardTitle>
              <CardDescription>
                Manage sent invitations and track their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending invitations</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Invited By</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invitation) => (
                        <TableRow key={invitation._id}>
                          <TableCell>
                            <div className="font-medium">{invitation.email}</div>
                            {invitation.message && (
                              <div className="text-sm text-muted-foreground mt-1">
                                "{invitation.message}"
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(invitation.role)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invitation.status)}
                          </TableCell>
                          <TableCell>
                            {users.find(u => u._id === invitation.invitedBy)?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatTimeAgo(invitation.expiresAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendInvitation(invitation._id)}
                              >
                                <Mail className="w-4 h-4 mr-1" />
                                Resend
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeInvitation(invitation._id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Revoke
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles and Permissions */}
        <TabsContent value="roles" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(ROLE_DEFINITIONS).map(([role, info]) => (
              <Card key={role}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${info.color}`} />
                    <span>{info.name}</span>
                  </CardTitle>
                  <CardDescription>{info.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Workflows</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center space-x-2">
                          {info.permissions.workflows.create ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                          <span>Create</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {info.permissions.workflows.update ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                          <span>Edit</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {info.permissions.workflows.delete ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                          <span>Delete</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {info.permissions.workflows.execute ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                          <span>Execute</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Administration</h4>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center space-x-2">
                          {info.permissions.collaboration.invite ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                          <span>Invite Users</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {info.permissions.admin.manageUsers ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                          <span>Manage Team</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {info.permissions.admin.viewAnalytics ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                          <span>View Analytics</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Activity Feed */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Team Activity</span>
              </CardTitle>
              <CardDescription>
                Recent actions performed by team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {activities.map((activity) => {
                      const actorUser = users.find(u => u._id === activity.user)
                      return (
                        <div key={activity._id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {actorUser?.name.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">
                              <span className="font-medium">{actorUser?.name || 'Unknown User'}</span>
                              {' '}
                              {activity.action === 'created_workflow' && 'created workflow'}
                              {activity.action === 'updated_agent' && 'updated agent'}
                              {activity.action === 'invited_user' && 'invited user'}
                              {' '}
                              <span className="font-medium">{activity.details.name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(activity.timestamp)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workspace Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Settings</CardTitle>
              <CardDescription>
                Configure workspace behavior and access policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {workspace && (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="workspace-name">Workspace Name</Label>
                        <Input
                          id="workspace-name"
                          value={workspace.name}
                          onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="workspace-description">Description</Label>
                        <Textarea
                          id="workspace-description"
                          value={workspace.description}
                          onChange={(e) => setWorkspace({ ...workspace, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="visibility">Visibility</Label>
                        <Select
                          value={workspace.settings.visibility}
                          onValueChange={(value) => setWorkspace({
                            ...workspace,
                            settings: { ...workspace.settings, visibility: value as any }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">
                              <div className="flex items-center space-x-2">
                                <Lock className="w-4 h-4" />
                                <span>Private</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="team">
                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4" />
                                <span>Team Only</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="public">
                              <div className="flex items-center space-x-2">
                                <Globe className="w-4 h-4" />
                                <span>Public</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="invite-policy">Who can invite users?</Label>
                        <Select
                          value={workspace.settings.invitePolicy}
                          onValueChange={(value) => setWorkspace({
                            ...workspace,
                            settings: { ...workspace.settings, invitePolicy: value as any }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner Only</SelectItem>
                            <SelectItem value="admin">Admins</SelectItem>
                            <SelectItem value="anyone">Anyone</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="default-role">Default Role for New Members</Label>
                        <Select
                          value={workspace.settings.defaultRole}
                          onValueChange={(value) => setWorkspace({
                            ...workspace,
                            settings: { ...workspace.settings, defaultRole: value as any }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Access & Security</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Allow Guest Access</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow non-members to view public workflows
                          </p>
                        </div>
                        <Switch
                          checked={workspace.settings.allowGuestAccess}
                          onCheckedChange={(checked) => setWorkspace({
                            ...workspace,
                            settings: { ...workspace.settings, allowGuestAccess: checked }
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Require Approval</Label>
                          <p className="text-sm text-muted-foreground">
                            New members need approval before joining
                          </p>
                        </div>
                        <Switch
                          checked={workspace.settings.requireApproval}
                          onCheckedChange={(checked) => setWorkspace({
                            ...workspace,
                            settings: { ...workspace.settings, requireApproval: checked }
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Comments</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow comments on workflows and agents
                          </p>
                        </div>
                        <Switch
                          checked={workspace.settings.enableComments}
                          onCheckedChange={(checked) => setWorkspace({
                            ...workspace,
                            settings: { ...workspace.settings, enableComments: checked }
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Versioning</Label>
                          <p className="text-sm text-muted-foreground">
                            Track changes and maintain version history
                          </p>
                        </div>
                        <Switch
                          checked={workspace.settings.enableVersioning}
                          onCheckedChange={(checked) => setWorkspace({
                            ...workspace,
                            settings: { ...workspace.settings, enableVersioning: checked }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">
                      Reset to Defaults
                    </Button>
                    <Button>
                      Save Changes
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}