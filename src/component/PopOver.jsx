import { ConfigProvider, Popover, Space } from "antd";
import React from "react";

const PopOver = ({
  content,
  children,
  trigger , 
  title ,
  token = {
    color: "black",
    borderRadius: 2,
    colorBgContainer: "#f6ffed",
  },
  placement = "top",
  arrow = true,
  zIndex = 999,
  mouseEnterDelay = 0.1,
  mouseLeaveDelay = 0.1,
  destroyOnHidden = false,
  onOpenChange,
}) => {
  return (
    <ConfigProvider theme={{ token }}>
      <Space wrap>
        <Popover
          content={content}
          title={title}
          trigger={trigger}
          placement={placement}
          arrow={arrow}
          zIndex={zIndex}
          mouseEnterDelay={mouseEnterDelay}
          mouseLeaveDelay={mouseLeaveDelay}
          destroyTooltipOnHide={destroyOnHidden}
          onOpenChange={onOpenChange}
        >
          {children}
        </Popover>
      </Space>
    </ConfigProvider>
  );
};

export default PopOver;
