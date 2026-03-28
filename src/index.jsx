// third party
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from './contexts/ConfigContext';

// Suprimir errores de desarrollo en consola
import './utils/suppressDevErrors';

// project imports
import App from './App';

// style + assets
import './index.scss';

// -----------------------|| REACT DOM RENDER  ||-----------------------//

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <ConfigProvider>
    <App />
  </ConfigProvider>
);
