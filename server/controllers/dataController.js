export const getData = async (req, res) => {
  try {
    // Example data - replace with your actual data source
    const items = [];
    res.json({ success: true, data: items, error: null });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: err.message,
    });
  }
};
