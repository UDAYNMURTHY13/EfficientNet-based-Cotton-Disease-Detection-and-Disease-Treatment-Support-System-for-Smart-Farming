import ReactDOM from 'react-dom/client';
import './i18n'; // initialise i18next before anything renders
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
