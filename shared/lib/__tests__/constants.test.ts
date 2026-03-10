import { APP_NAME } from '@/shared/lib/app-name';
import { BUTTON } from '@/shared/lib/buttons';
import { ROUTES } from '@/shared/lib/routes';

describe('BUTTON constants', () => {
  it('CREATE is "Create"', () => {
    return expect(BUTTON.CREATE).toBe('Create');
  });
  it('SAVE is "Save"', () => {
    return expect(BUTTON.SAVE).toBe('Save');
  });
  it('ADD is "Add"', () => {
    return expect(BUTTON.ADD).toBe('Add');
  });
  it('CANCEL is "Cancel"', () => {
    return expect(BUTTON.CANCEL).toBe('Cancel');
  });
  it('DELETE is "Delete"', () => {
    return expect(BUTTON.DELETE).toBe('Delete');
  });
  it('INVITE is "Invite"', () => {
    return expect(BUTTON.INVITE).toBe('Invite');
  });
});

describe('APP_NAME', () => {
  it('is "Tribes"', () => {
    return expect(APP_NAME).toBe('Tribes');
  });
});

describe('ROUTES', () => {
  it('login route is correct', () => {
    return expect(ROUTES.AUTH.LOGIN).toBe('/auth/login');
  });
  it('register route is correct', () => {
    return expect(ROUTES.AUTH.REGISTER).toBe('/auth/register');
  });
  it('dashboard chat route is correct', () => {
    return expect(ROUTES.DASHBOARD.CHAT).toBe('/dashboard/chat');
  });
  it('dashboard teams route is correct', () => {
    return expect(ROUTES.DASHBOARD.TEAMS).toBe('/dashboard/teams');
  });
  it('profile route is correct', () => {
    return expect(ROUTES.DASHBOARD.PROFILE).toBe('/dashboard/profile');
  });
});
