export const getHealth = async (req, res) => {
  try {
    res.json({
      success: true,
      data: { status: "ok", timestamp: new Date().toISOString() },
      error: null,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: err.message,
    });
  }
};
