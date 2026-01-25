import Layout from '@components/layout/Layout';
import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

const Home = lazy(() => import('@pages/Home'));
const Gallery = lazy(() => import('@pages/Gallery'));
const About = lazy(() => import('@pages/About'));
const Contact = lazy(() => import('@pages/Contact'));

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
    </Routes>
  );
}
