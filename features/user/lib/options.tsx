import { DatabaseZap, UserRoundX } from 'lucide-react';

export const USER_MENU = [
  {
    id: 'log-out',
    title: 'Log out',
    action: 'logout',
  },
];

export const USER_ERRORS = {
  notFound: {
    icon: <UserRoundX className='text-red-700' />,
    message: 'User not found',
  },
  server: {
    icon: <DatabaseZap className='text-red-700' />,
    message: 'Server Error',
  },
} as const;
