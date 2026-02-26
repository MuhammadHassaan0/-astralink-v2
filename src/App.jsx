import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Page1 from './pages/page 1.jsx';
import Page2 from './pages/page 2.jsx';
import Page3 from './pages/page 3.jsx';
import Page4 from './pages/page 4 .jsx';
import Page5 from './pages/page 5.jsx';
import Page6 from './pages/page 6.jsx';
import Page7 from './pages/page 7.jsx';
import Page8 from './pages/page 8.jsx';
import Page9 from './pages/page 9.jsx';
import Page10 from './pages/page 10.jsx';
import Page10A from './pages/page 10A.jsx';
import Page10B from './pages/page 10B.jsx';
import Page10C from './pages/page 10C.jsx';
import Page10D from './pages/page 10D.jsx';
import ChatPage from './pages/chat page.jsx';
import QAPage from './pages/QAPage.jsx';
import Page10E from './pages/page 10E.jsx';
import Auth, { SignInPage } from './pages/login sign up page.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Page1 />} />
      <Route path="/story" element={<Page2 />} />
      <Route path="/proof" element={<Page3 />} />
      <Route path="/why" element={<Page4 />} />
      <Route path="/footer" element={<Page5 />} />
      <Route path="/start" element={<Page6 />} />
      <Route path="/questions" element={<Page7 />} />
      <Route path="/qa" element={<QAPage />} />
      <Route path="/reveal" element={<Page8 />} />
      <Route path="/collect" element={<Page9 />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/share" element={<Page10 />} />
      <Route path="/family" element={<Page10D />} />
      <Route path="/journey" element={<Page10A />} />
      <Route path="/record" element={<Page10B />} />
      <Route path="/progress" element={<Page10C />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/settings" element={<Page10E />} />
    </Routes>
  );
}
