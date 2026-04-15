import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, RoleType } from '@/graphql/generated/types';

export type { User };
export type UserRole = RoleType;

interface UserState {
	user: User | null;
	isAuthenticated: boolean;
}

const initialState: UserState = {
	user: null,
	isAuthenticated: false,
};

const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		setUser: (state, action: PayloadAction<User>) => {
			state.user = action.payload;
			state.isAuthenticated = true;
		},
		clearUser: (state) => {
			state.user = null;
			state.isAuthenticated = false;
		},
		updateUser: (state, action: PayloadAction<Partial<User>>) => {
			if (state.user) {
				state.user = { ...state.user, ...action.payload };
			}
		},
	},
});

export const { setUser, clearUser, updateUser } = userSlice.actions;
export default userSlice.reducer;

