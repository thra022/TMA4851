import { useState } from 'react';
import { validateSignature } from '../services/api';

export function ValidateSignaturePage() {
    const [file, setFile] = useState<File | null>(null);
    const [probability, setProbability] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError("Please upload a file.");
            return;
        }

        try {
            const data = await validateSignature(file);
            setProbability(data.probability);
        } catch (err) {
            setError("Validation failed. Please try again.");
        }
    };

    return (
        <div className='flex justify-center'>
            <form className='flex flex-col items-center' onSubmit={handleSubmit}>
                <input type='file' onChange={handleFileChange} />
                <button type='submit'>Validate Signature</button>
                {probability !== null && <p>Probability: {probability}</p>}
                {error && <p className='text-red-500'>{error}</p>}
            </form>
        </div>
    );
}
