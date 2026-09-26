declare module "next/image" {
  import * as React from "react";
  
  interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    width?: number | string;
    height?: number | string;
  }

  const Image: React.ComponentType<ImageProps>;
  export default Image;
}
