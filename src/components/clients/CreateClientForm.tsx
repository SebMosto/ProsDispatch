import React from 'react';
import { ClientAndPropertySchema } from '../../schemas/client';

const CreateClientForm: React.FC = () => {
  // Placeholder to ensure schema is referenced for future validation logic
  const schema = ClientAndPropertySchema;
  void schema;

  return (
    <section>
      <h2>Create Client &amp; Property</h2>
      {/* TODO: Implement form fields and submission handling */}
    </section>
  );
};

export default CreateClientForm;
