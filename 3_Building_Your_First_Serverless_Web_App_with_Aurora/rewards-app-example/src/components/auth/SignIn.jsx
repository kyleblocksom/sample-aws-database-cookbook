import React, { useState } from 'react';
import { Auth } from 'aws-amplify';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { doLogin, updateModal } from '../../store/slices/authSlice';

const SignIn = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const user = await Auth.signIn(username, password);
      
      // Handle different user states
      if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
        console.log('New password required for user');
        setError('Please set a new password for this account through the Cognito console first.');
        return;
      }
      
      // Get email from user attributes or use username
      const email = user.attributes?.email || username;
      
      // Verify session is available
      try {
        const session = await Auth.currentSession();
      } catch (sessionError) {
        console.log('⚠️ Session not immediately available:', sessionError.message);
      }
      
      dispatch(doLogin({ email }));
      
      // Longer delay to ensure session is established for manually created users
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('❌ Sign in error:', error);
      setError(error.message);
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {t('auth.signin.signInToAccount')}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form className="space-y-6" onSubmit={handleSignIn}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900">
              {t('auth.signin.username')}
            </label>
            <div className="mt-2">
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
              {t('auth.signin.password')}
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {t('common.auth.signIn')}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          {t('auth.signin.dontHaveAccount')}{' '}
          <button 
            onClick={() => {
              dispatch(updateModal(false));
              navigate('/signup');
            }} 
            className="font-semibold leading-6 text-blue-600 hover:text-blue-500"
          >
            {t('common.auth.signUp')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignIn;