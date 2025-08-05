import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateModal } from '../../store/slices/authSlice';
import SignIn from './SignIn';

const AuthModal = () => {
  const dispatch = useDispatch();
  const modalOpen = useSelector(state => state.auth.modalOpen);
  
  const closeModal = () => {
    dispatch(updateModal(false));
  };
  
  if (!modalOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-[#0000007d] z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button 
          onClick={closeModal}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="mt-4">
          <SignIn />
        </div>
      </div>
    </div>
  );
};

export default AuthModal;