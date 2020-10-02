import React from "react";
import { useAddProfilePictureMutation } from "../generated/graphql";

interface UploadProps {}

export const Upload: React.FC<UploadProps> = ({}) => {
  const [, addProfilePicture] = useAddProfilePictureMutation();

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
  return <input type="file" required onChange={handleChange} />;
};
