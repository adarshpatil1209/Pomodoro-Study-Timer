return (
  <Routes>
    {/* Public */}
    <Route path="/" element={<LandingPage />} />

    <Route
      path="/auth"
      element={user ? <Navigate to="/app" /> : <AuthPage />}
    />

    <Route
      path="/setup"
      element={
        !user ? (
          <Navigate to="/auth" />
        ) : profile?.exam_name ? (
          <Navigate to="/app" />
        ) : (
          <ProfileSetup />
        )
      }
    />

    {/* Protected */}
    <Route
      path="/app"
      element={
        !user ? (
          <Navigate to="/auth" />
        ) : !profile?.exam_name ? (
          <Navigate to="/setup" />
        ) : (
          <Dashboard />
        )
      }
    />

    <Route
      path="/study"
      element={!user ? <Navigate to="/auth" /> : <MainApp />}
    />

    <Route
      path="/room/:roomId"
      element={!user ? <Navigate to="/auth" /> : <MainApp />}
    />

    <Route
      path="/settings"
      element={!user ? <Navigate to="/auth" /> : <Settings />}
    />

    <Route path="/watch" element={<WatchPage />} />
  </Routes>
)