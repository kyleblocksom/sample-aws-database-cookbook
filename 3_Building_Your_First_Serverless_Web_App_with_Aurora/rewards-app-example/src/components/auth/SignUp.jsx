import React, { useState } from 'react';
import { Auth } from 'aws-amplify';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SignUp = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await Auth.signUp({
        username: email,
        password,
        attributes: { email }
      });
      setShowConfirmation(true);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleConfirmSignUp = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await Auth.confirmSignUp(email, confirmationCode);
      navigate('/signin');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {showConfirmation ? 'Confirm your account' : 'Create a new account'}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        
        {!showConfirmation ? (
          <form className="space-y-6" onSubmit={handleSignUp}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900">
                {t('auth.signup.username')}
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
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                {t('auth.signup.emailAddress')}
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                {t('auth.signup.password')}
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
                {t('common.auth.signUp')}
              </button>
            </div>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleConfirmSignUp}>
            <div>
              <label htmlFor="confirmationCode" className="block text-sm font-medium leading-6 text-gray-900">
                {t('auth.signup.confirmationCode')}
              </label>
              <div className="mt-2">
                <input
                  id="confirmationCode"
                  name="confirmationCode"
                  type="text"
                  required
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {t('auth.signup.confirmSignUp')}
              </button>
            </div>
          </form>
        )}

        <p className="mt-10 text-center text-sm text-gray-500">
          {t('auth.signup.alreadyHaveAccount')}{' '}
          <button 
            onClick={() => navigate('/signin')} 
            className="font-semibold leading-6 text-blue-600 hover:text-blue-500"
          >
            {t('common.auth.signIn')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;