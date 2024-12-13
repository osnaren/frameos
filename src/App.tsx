import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

import { ThemeProvider } from '@components/layout/ThemeProvider';
import { MenuProvider } from '@components/layout/Menu';
import Layout from '@components/layout/Layout';

const Home = lazy(() =>
  import('@pages/Home').then((module) => {
    return new Promise((resolve) => setTimeout(() => resolve(module), 300));
  })
);
const Gallery = lazy(() =>
  import('@pages/Gallery').then((module) => {
    return new Promise((resolve) => setTimeout(() => resolve(module), 300));
  })
);
const About = lazy(() =>
  import('@pages/About').then((module) => {
    return new Promise((resolve) => setTimeout(() => resolve(module), 300));
  })
);
const Contact = lazy(() =>
  import('@pages/Contact').then((module) => {
    return new Promise((resolve) => setTimeout(() => resolve(module), 300));
  })
);

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
