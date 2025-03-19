import React, { useState } from 'react';

const InputField = ({ question, onSubmit }) => {
  const [inputValue, setInputValue] = useState('');

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(inputValue);
    setInputValue(''); // Clear input after submission
  };

  return (
    <div className="input-field-container">
      <form onSubmit={handleSubmit} className="input-field-form">
        <label htmlFor="inputField" className="input-field-label">
          {question}
        </label>
        <input
          type="text"
          id="inputField"
          value={inputValue}
          onChange={handleChange}
          className="input-field-input"
        />
        <button type="submit" className="input-field-button">
          Submit
        </button>
      </form>
    </div>
  );
};

export default InputField;