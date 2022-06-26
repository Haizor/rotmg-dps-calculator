import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import setsSlice from '../features/player/setsSlice';
import settingsSlice from '../features/settingsSlice'

export const store = configureStore({
  reducer: {
    sets: setsSlice,
    settings: settingsSlice
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
