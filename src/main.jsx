import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './WorkbenchApp.jsx';
import './style.css';
import './workbench.css';

createRoot(document.getElementById('root')).render(<App/>);
