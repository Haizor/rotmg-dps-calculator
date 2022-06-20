import React, { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './index.css';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SetPage from './routes/SetPage';
import EquipSelectorPage from './routes/EquipSelectorPage';
import PlayerSelectorPage from './routes/PlayerSelectorPage';
import { ChangelogPage } from './routes/ChangelogPage';
import { HelpPage } from './routes/HelpPage';

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
	<React.StrictMode>
		<Provider store={store}>
			<MemoryRouter>
				<Routes>
					<Route path="/" element={<App />} >
						<Route path="set/:index" element={ <SetPage />}>
							<Route path="equipment/:equipIndex" element={ <EquipSelectorPage /> } />
							<Route path="player" element={ <PlayerSelectorPage /> } />
						</Route>
						<Route path="changelog" element={ <ChangelogPage /> } />
						<Route path="help" element={ <HelpPage />} />
					</Route>
				</Routes>
			</MemoryRouter>
		</Provider>
	</React.StrictMode>
);
	
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
	