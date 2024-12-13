// Libraries
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

// Components
import { ThemeProvider } from '@components/layout/ThemeProvider';
import { MenuProvider } from '@components/layout/Menu';
import Layout from '@components/layout/Layout';

const Loader = lazy(() => import('@components/loader/Loader'));
// Pages
const Home = lazy(() => import('@pages/Home'));
const Gallery = lazy(() => import('@pages/Gallery'));
const About = lazy(() => import('@pages/About'));
const Contact = lazy(() => import('@pages/Contact'));

// App

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Router>
          <MenuProvider>
            <Layout>
              <Suspense
                fallback={
                  <div className="fixed inset-0 flex items-center justify-center">
                    <Loader />
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                </Routes>
              </Suspense>
            </Layout>
            <Toaster position="bottom-right" />
          </MenuProvider>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
