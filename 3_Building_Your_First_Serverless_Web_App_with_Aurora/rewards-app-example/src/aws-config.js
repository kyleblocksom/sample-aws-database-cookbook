import { Amplify } from 'aws-amplify';

// Use environment variables
const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://46nyjtv3kk.execute-api.us-west-2.amazonaws.com/dev';
const USER_POOL_ID = import.meta.env.VITE_USER_POOL_ID || 'us-west-2_n5PaXfnkG';
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || 'sao8tcp08hmn06lcg7pckvnog';

// Extract region from User Pool ID
const REGION = USER_POOL_ID.split('_')[0] || 'us-west-2';

Amplify.configure({
  Auth: {
    region: REGION,
    userPoolId: USER_POOL_ID,
    userPoolWebClientId: CLIENT_ID,
    authenticationFlowType: 'USER_PASSWORD_AUTH'
  }
});

export default Amplify;