import { useEffect } from 'react';
import { Auth } from 'aws-amplify';
import { useDispatch, useSelector } from 'react-redux';
import { doLogin, doLogout } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(state => state.auth.isLoggedIn);
  
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        const session = await Auth.currentSession();
        
        if (user && session.isValid()) {
          const email = user.attributes?.email || user.username;
          dispatch(doLogin({ email }));
        } else {
          console.log('⚠️ Invalid session on load');
          dispatch(doLogout());
        }
      } catch (error) {
        console.log('⚠️ No authenticated user on load:', error.message);
        dispatch(doLogout());
      }
    };
    
    checkAuthState();
  }, [dispatch]);
  
  return { isLoggedIn };
};