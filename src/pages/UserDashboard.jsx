import React, { useEffect } from "react";

const UserDashboard = () => {
  const { palette, vertical, horizontal, verticalName, horizontalName } = useAvie();

  // Log when palette changes
  useEffect(() => {
    console.log("Current palette:", palette);
  }, [palette]);

  // Don't render until palette is ready
  if (!palette || !Array.isArray(palette) || palette.length === 0) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "10px" }}>🎨</div>
          <div>Loading AVIE colors...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      padding: "20px",
      background: `linear-gradient(135deg, ${palette[0]}15, ${palette[1] || palette[0]}15)`,
      display: "flex",
      gap: "20px",
      flexWrap: "wrap"
    }}>
      {/* AVIE Panel */}
      <AviePanel />
      
      {/* Color Preview Section */}
      <div style={{
        flex: 1,
        minWidth: "400px",
        backgroundColor: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(10px)",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        border: "1px solid rgba(255,255,255,0.2)"
      }}>
        {/* Header with current selection */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          paddingBottom: "15px",
          borderBottom: `2px solid ${palette[0]}30`
        }}>
          <h3 style={{ 
            margin: 0, 
            color: palette[0],
            fontSize: "18px",
            fontWeight: 600
          }}>
            Current Configuration
          </h3>
          <div style={{
            padding: "4px 12px",
            backgroundColor: palette[0] + "10",
            borderRadius: "20px",
            fontSize: "12px",
            color: palette[0]
          }}>
            {verticalName} • {horizontalName}
          </div>
        </div>

        {/* Color Palette Display */}
        <div style={{ marginBottom: "25px" }}>
          <div style={{ 
            fontSize: "13px", 
            fontWeight: 500, 
            marginBottom: "10px",
            color: "#4a5568"
          }}>
            Active Palette Colors
          </div>
          <div style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap"
          }}>
            {palette.map((color, index) => (
              <div key={index} style={{ textAlign: "center" }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: color,
                  borderRadius: "12px",
                  border: "3px solid white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  marginBottom: "5px",
                  transition: "transform 0.2s",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                />
                <div style={{ 
                  fontSize: "10px", 
                  color: "#666",
                  fontFamily: "monospace"
                }}>
                  Color {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Color Preview Bars */}
        <div style={{ marginBottom: "25px" }}>
          <div style={{ 
            fontSize: "13px", 
            fontWeight: 500, 
            marginBottom: "10px",
            color: "#4a5568"
          }}>
            Color Preview
          </div>
          <div style={{
            display: "flex",
            gap: "10px",
            marginBottom: "15px"
          }}>
            {palette.slice(0, 3).map((color, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: "11px", 
                  color: "#666",
                  marginBottom: "4px",
                  textAlign: "center"
                }}>
                  {i === 0 ? 'Primary' : i === 1 ? 'Accent' : 'Neutral'}
                </div>
                <div style={{
                  height: "40px",
                  backgroundColor: color,
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }} />
              </div>
            ))}
          </div>
        </div>

        {/* Sample Chart Preview */}
        <div>
          <div style={{ 
            fontSize: "13px", 
            fontWeight: 500, 
            marginBottom: "15px",
            color: "#4a5568"
          }}>
            Sample Chart Preview
          </div>
          <div style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
          }}>
            {/* Mini bar chart */}
            <div style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "12px",
              height: "120px"
            }}>
              {[65, 45, 80, 55, 70, 40, 90].map((value, i) => (
                <div key={i} style={{ 
                  flex: 1, 
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}>
                  <div style={{
                    width: "100%",
                    height: `${value}px`,
                    background: `linear-gradient(180deg, ${palette[i % palette.length]} 0%, ${palette[(i + 1) % palette.length]} 100%)`,
                    borderRadius: "6px 6px 0 0",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    transition: "height 0.3s"
                  }} />
                  <div style={{
                    fontSize: "9px",
                    marginTop: "5px",
                    color: "#666"
                  }}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i]}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{
              display: "flex",
              gap: "20px",
              marginTop: "20px",
              paddingTop: "15px",
              borderTop: "1px solid #e2e8f0"
            }}>
              {palette.slice(0, 2).map((color, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: color,
                    borderRadius: "4px"
                  }} />
                  <span style={{ fontSize: "11px", color: "#4a5568" }}>
                    {i === 0 ? 'Series A' : 'Series B'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div style={{
          marginTop: "20px",
          padding: "12px",
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          fontSize: "11px",
          color: "#64748b",
          display: "flex",
          justifyContent: "space-between"
        }}>
          <span>🎨 {palette.length} colors in palette</span>
          <span>📊 Preview updates in real-time</span>
          <span>⚡ AVIE Active</span>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;