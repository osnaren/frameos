import Layout from '@components/layout/Layout';
import { MenuProvider } from '@components/layout/Menu';
import { ThemeProvider } from '@components/theme/ThemeProvider';
import { lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

const Home = lazy(() => import('@pages/Home'));
const Gallery = lazy(() => import('@pages/Gallery'));
const About = lazy(() => import('@pages/About'));
const Contact = lazy(() => import('@pages/Contact'));

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Router>
          <MenuProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
              </Route>
            </Routes>
            <Toaster position="bottom-right" />
          </MenuProvider>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
