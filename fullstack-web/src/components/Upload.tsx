import React, { useState } from "react";
import { useAddProfilePictureMutation } from "../generated/graphql";

interface UploadProps {
  name: string;
  file: any;
}

export const Upload: React.FC<UploadProps> = ({ name, file }) => {
  const [, addProfilePicture] = useAddProfilePictureMutation();
  // const { Dragger } = UploadAntd;

  // const props = {
  //   name,
  //   multiple: false,
  //   // customRequest: addProfilePicture,
  //   data: (response: any) => console.log("response!", response),
  //   action: "action",
  //
  //   beforeUpload(info: any) {
  //     console.log("hello!", info);
  //     return info;
  //     // const { status } = info.file;
  //     // console.log(info);
  //     // if (status !== "uploading") {
  //     //   console.log(info.file, info.fileList);
  //     // }
  //     // if (status === "done") {
  //     //   message.success(`${info.file.name} file uploaded successfully.`);
  //     // } else if (status === "error") {
  //     //   message.error(`${info.file.name} file upload failed.`);
  //     // }
  //   },
  // };

  //@save, old way
  const handleChange = React.useCallback(
    ({
      target: {
        validity,
        files: [file],
      },
    }) => validity.valid && addProfilePicture({ file }),
    [addProfilePicture]
  );
  //@todo create Formik form with error-handling and filetype restrictions, check upload.resolver.ts in backend.
  return <input type="file" name="upload" required onChange={handleChange} />;
  // return (
  //   <Dragger {...props}>
  //     <p className="ant-upload-drag-icon">
  //       <InboxOutlined />
  //     </p>
  //     <p className="ant-upload-text">
  //       Click or drag file to this area to upload
  //     </p>
  //     <p className="ant-upload-hint">
  //       Strictly prohibit from uploading copyrighted or illegal files.
  //     </p>
  //   </Dragger>
  // );
};
