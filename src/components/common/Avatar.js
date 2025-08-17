import { Avatar as MuiAvatar } from '@mui/material';
import { SmartToy, Person, AccountCircle } from '@mui/icons-material';

const Avatar = ({ type }) => {
  return (
    <MuiAvatar>
      {type === 'bot' ? <SmartToy /> : 
       type === 'human' ? <Person /> : <AccountCircle />}
    </MuiAvatar>
  );
};