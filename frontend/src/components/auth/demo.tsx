// Demo file to test component imports
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm, AuthGuard } from './index';

export const AuthDemo: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="space-y-8 p-8">
          <div>
            <h2 className="text-xl font-bold mb-4">Login Form</h2>
            <LoginForm />
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-4">Register Form</h2>
            <RegisterForm />
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-4">Forgot Password Form</h2>
            <ForgotPasswordForm />
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-4">Reset Password Form</h2>
            <ResetPasswordForm />
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-4">Protected Content</h2>
            <AuthGuard>
              <div className="p-4 bg-green-100 rounded">
                This content is protected and only visible to authenticated users.
              </div>
            </AuthGuard>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};