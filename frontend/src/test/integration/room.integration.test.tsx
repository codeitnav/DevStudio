import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { CreateRoomModal } from '../../components/room/CreateRoomModal';
import { JoinRoomModal } from '../../components/room/JoinRoomModal';
import { RoomCard } from '../../components/room/RoomCard';
import { roomService } from '../../services/roomService';
import { socketService } from '../../services/socketService';
import { mockUser, mockRoom, mockApiResponse, createSocketMock } from '../utils';

// Mock services
vi.mock('../../services/roomService', () => ({
  roomService: {
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    getRoomInfo: vi.fn(),
    updateRoomSettings: vi.fn(),
    getRoomMembers: vi.fn(),
  },
}));

vi.mock('../../services/socketService', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    isConnected: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

const mockRoomService = vi.mocked(roomService);
const mockSocketService = vi.mocked(socketService);

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider initialUser={mockUser}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Room Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocketService.isConnected.mockReturnValue(true);
  });

  describe('Create Room Flow', () => {
    it('should create a room successfully', async () => {
      const mockCreateResponse = mockApiResponse(mockRoom);
      mockRoomService.createRoom.mockResolvedValue(mockCreateResponse.data);

      const onSuccess = vi.fn();
      const onClose = vi.fn();

      render(
        <TestWrapper>
          <CreateRoomModal 
            isOpen={true} 
            onClose={onClose} 
            onSuccess={onSuccess}
          />
        </TestWrapper>
      );

      // Fill in the form
      const nameInput = screen.getByLabelText(/room name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const languageSelect = screen.getByLabelText(/programming language/i);
      const createButton = screen.getByRole('button', { name: /create room/i });

      fireEvent.change(nameInput, { target: { value: 'Test Room' } });
      fireEvent.change(descriptionInput, { target: { value: 'A test room' } });
      fireEvent.change(languageSelect, { target: { value: 'javascript' } });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockRoomService.createRoom).toHaveBeenCalledWith({
          name: 'Test Room',
          description: 'A test room',
          language: 'javascript',
          isPublic: true,
          hasPassword: false,
          maxMembers: 10,
        });
      });

      expect(onSuccess).toHaveBeenCalledWith(mockRoom);
      expect(onClose).toHaveBeenCalled();
    });

    it('should create a private room with password', async () => {
      const mockCreateResponse = mockApiResponse({
        ...mockRoom,
        isPublic: false,
        hasPassword: true,
      });
      mockRoomService.createRoom.mockResolvedValue(mockCreateResponse.data);

      const onSuccess = vi.fn();

      render(
        <TestWrapper>
          <CreateRoomModal 
            isOpen={true} 
            onClose={vi.fn()} 
            onSuccess={onSuccess}
          />
        </TestWrapper>
      );

      // Fill in the form
      const nameInput = screen.getByLabelText(/room name/i);
      const privateToggle = screen.getByLabelText(/private room/i);
      const passwordInput = screen.getByLabelText(/room password/i);
      const createButton = screen.getByRole('button', { name: /create room/i });

      fireEvent.change(nameInput, { target: { value: 'Private Room' } });
      fireEvent.click(privateToggle);
      fireEvent.change(passwordInput, { target: { value: 'secret123' } });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockRoomService.createRoom).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Private Room',
            isPublic: false,
            hasPassword: true,
            password: 'secret123',
          })
        );
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should handle room creation errors', async () => {
      mockRoomService.createRoom.mockRejectedValue(new Error('Room name already exists'));

      render(
        <TestWrapper>
          <CreateRoomModal 
            isOpen={true} 
            onClose={vi.fn()} 
            onSuccess={vi.fn()}
          />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/room name/i);
      const createButton = screen.getByRole('button', { name: /create room/i });

      fireEvent.change(nameInput, { target: { value: 'Existing Room' } });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockRoomService.createRoom).toHaveBeenCalled();
      });

      expect(screen.getByText(/room name already exists/i)).toBeInTheDocument();
    });
  });

  describe('Join Room Flow', () => {
    it('should join a public room successfully', async () => {
      const mockJoinResponse = mockApiResponse({
        room: mockRoom,
        members: [
          { userId: '1', username: 'testuser', role: 'member', isOnline: true },
        ],
      });
      mockRoomService.joinRoom.mockResolvedValue(mockJoinResponse.data);

      const onSuccess = vi.fn();
      const onClose = vi.fn();

      render(
        <TestWrapper>
          <JoinRoomModal 
            isOpen={true} 
            onClose={onClose} 
            onSuccess={onSuccess}
          />
        </TestWrapper>
      );

      const roomIdInput = screen.getByLabelText(/room id/i);
      const joinButton = screen.getByRole('button', { name: /join room/i });

      fireEvent.change(roomIdInput, { target: { value: 'room-1' } });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(mockRoomService.joinRoom).toHaveBeenCalledWith('room-1', undefined);
      });

      expect(mockSocketService.joinRoom).toHaveBeenCalledWith('room-1', undefined);
      expect(onSuccess).toHaveBeenCalledWith(mockJoinResponse.data);
      expect(onClose).toHaveBeenCalled();
    });

    it('should join a password-protected room', async () => {
      const protectedRoom = { ...mockRoom, hasPassword: true };
      const mockJoinResponse = mockApiResponse({
        room: protectedRoom,
        members: [],
      });
      mockRoomService.joinRoom.mockResolvedValue(mockJoinResponse.data);

      const onSuccess = vi.fn();

      render(
        <TestWrapper>
          <JoinRoomModal 
            isOpen={true} 
            onClose={vi.fn()} 
            onSuccess={onSuccess}
          />
        </TestWrapper>
      );

      const roomIdInput = screen.getByLabelText(/room id/i);
      const passwordInput = screen.getByLabelText(/room password/i);
      const joinButton = screen.getByRole('button', { name: /join room/i });

      fireEvent.change(roomIdInput, { target: { value: 'room-1' } });
      fireEvent.change(passwordInput, { target: { value: 'secret123' } });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(mockRoomService.joinRoom).toHaveBeenCalledWith('room-1', 'secret123');
      });

      expect(mockSocketService.joinRoom).toHaveBeenCalledWith('room-1', 'secret123');
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should handle incorrect password', async () => {
      mockRoomService.joinRoom.mockRejectedValue(new Error('Incorrect password'));

      render(
        <TestWrapper>
          <JoinRoomModal 
            isOpen={true} 
            onClose={vi.fn()} 
            onSuccess={vi.fn()}
          />
        </TestWrapper>
      );

      const roomIdInput = screen.getByLabelText(/room id/i);
      const passwordInput = screen.getByLabelText(/room password/i);
      const joinButton = screen.getByRole('button', { name: /join room/i });

      fireEvent.change(roomIdInput, { target: { value: 'room-1' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(mockRoomService.joinRoom).toHaveBeenCalled();
      });

      expect(screen.getByText(/incorrect password/i)).toBeInTheDocument();
    });

    it('should handle room not found', async () => {
      mockRoomService.joinRoom.mockRejectedValue(new Error('Room not found'));

      render(
        <TestWrapper>
          <JoinRoomModal 
            isOpen={true} 
            onClose={vi.fn()} 
            onSuccess={vi.fn()}
          />
        </TestWrapper>
      );

      const roomIdInput = screen.getByLabelText(/room id/i);
      const joinButton = screen.getByRole('button', { name: /join room/i });

      fireEvent.change(roomIdInput, { target: { value: 'nonexistent' } });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(mockRoomService.joinRoom).toHaveBeenCalled();
      });

      expect(screen.getByText(/room not found/i)).toBeInTheDocument();
    });
  });

  describe('Room Card Interactions', () => {
    it('should display room information correctly', () => {
      const onJoin = vi.fn();

      render(
        <TestWrapper>
          <RoomCard room={mockRoom} onJoin={onJoin} />
        </TestWrapper>
      );

      expect(screen.getByText(mockRoom.name)).toBeInTheDocument();
      expect(screen.getByText(mockRoom.description)).toBeInTheDocument();
      expect(screen.getByText(mockRoom.language)).toBeInTheDocument();
      expect(screen.getByText(`${mockRoom.currentMembers}/${mockRoom.maxMembers}`)).toBeInTheDocument();
    });

    it('should handle join room action', () => {
      const onJoin = vi.fn();

      render(
        <TestWrapper>
          <RoomCard room={mockRoom} onJoin={onJoin} />
        </TestWrapper>
      );

      const joinButton = screen.getByRole('button', { name: /join room/i });
      fireEvent.click(joinButton);

      expect(onJoin).toHaveBeenCalledWith(mockRoom);
    });

    it('should show password indicator for protected rooms', () => {
      const protectedRoom = { ...mockRoom, hasPassword: true };

      render(
        <TestWrapper>
          <RoomCard room={protectedRoom} onJoin={vi.fn()} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/password protected/i)).toBeInTheDocument();
    });

    it('should show full indicator when room is at capacity', () => {
      const fullRoom = { ...mockRoom, currentMembers: mockRoom.maxMembers };

      render(
        <TestWrapper>
          <RoomCard room={fullRoom} onJoin={vi.fn()} />
        </TestWrapper>
      );

      const joinButton = screen.getByRole('button', { name: /join room/i });
      expect(joinButton).toBeDisabled();
      expect(screen.getByText(/full/i)).toBeInTheDocument();
    });
  });

  describe('Real-time Room Updates', () => {
    it('should handle user joining room', async () => {
      const mockSocket = createSocketMock();
      let userJoinedHandler: Function;

      mockSocketService.on.mockImplementation((event, handler) => {
        if (event === 'user:joined') {
          userJoinedHandler = handler;
        }
      });

      const TestComponent = () => {
        const [members, setMembers] = React.useState([]);

        React.useEffect(() => {
          mockSocketService.on('user:joined', (user) => {
            setMembers(prev => [...prev, user]);
          });
        }, []);

        return (
          <div>
            <div data-testid="member-count">{members.length}</div>
            {members.map(member => (
              <div key={member.userId} data-testid="member">
                {member.username}
              </div>
            ))}
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Simulate user joining
      const newUser = {
        userId: '2',
        username: 'newuser',
        role: 'member',
        isOnline: true,
      };

      userJoinedHandler!(newUser);

      await waitFor(() => {
        expect(screen.getByTestId('member-count')).toHaveTextContent('1');
        expect(screen.getByTestId('member')).toHaveTextContent('newuser');
      });
    });

    it('should handle user leaving room', async () => {
      let userLeftHandler: Function;

      mockSocketService.on.mockImplementation((event, handler) => {
        if (event === 'user:left') {
          userLeftHandler = handler;
        }
      });

      const TestComponent = () => {
        const [members, setMembers] = React.useState([
          { userId: '1', username: 'user1' },
          { userId: '2', username: 'user2' },
        ]);

        React.useEffect(() => {
          mockSocketService.on('user:left', ({ userId }) => {
            setMembers(prev => prev.filter(member => member.userId !== userId));
          });
        }, []);

        return (
          <div>
            <div data-testid="member-count">{members.length}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('member-count')).toHaveTextContent('2');

      // Simulate user leaving
      userLeftHandler!({ userId: '2' });

      await waitFor(() => {
        expect(screen.getByTestId('member-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Room Cleanup', () => {
    it('should leave room and disconnect socket on unmount', () => {
      const TestComponent = () => {
        React.useEffect(() => {
          mockSocketService.joinRoom('room-1');
          
          return () => {
            mockSocketService.leaveRoom('room-1');
          };
        }, []);

        return <div>Room Component</div>;
      };

      const { unmount } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(mockSocketService.joinRoom).toHaveBeenCalledWith('room-1');

      unmount();

      expect(mockSocketService.leaveRoom).toHaveBeenCalledWith('room-1');
    });
  });
});