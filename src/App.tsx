import { MenuProvider } from '@components/layout/Menu';
import { ThemeProvider } from '@components/theme/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router } from 'react-router-dom';

import AppRoutes from '@/routes/AppRoutes';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <MenuProvider>
          <AppRoutes />
          <Toaster position="bottom-right" />
        </MenuProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
