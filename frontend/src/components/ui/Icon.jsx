// src/components/ui/Icon.jsx

export const Icon = ({ path, viewBox = "0 0 24 24", className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
    <path d={path} />
  </svg>
);

export const AddTaskIcon = ({ className }) => (
    <Icon
        className={className}
        path="M12 5v14m-7-7h14"
    />
);

export const EditIcon = ({ className, ...props }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
   <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
   <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);


export const DeleteIcon = ({ className }) => (
  <Icon
    className={className}
    path="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
    viewBox="0 0 24 24"
  />
);