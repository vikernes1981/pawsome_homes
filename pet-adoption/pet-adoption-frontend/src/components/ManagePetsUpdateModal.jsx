import React, { useState, useEffect } from 'react';
import { addPet, updatePet, deletePet } from '../services/PostServicesPets';

const ManagePetsModal = ({ pet, onClose, onSave }) => {
    const [currentPet, setCurrentPet] = useState(pet || {});
    const [notification, setNotification] = useState({ message: '', visible: false });

    useEffect(() => {
        setCurrentPet(pet);
    }, [pet]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentPet({ ...currentPet, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (pet) {
                await updatePet(currentPet._id, currentPet);
                setNotification({ message: 'Pet updated successfully!', visible: true });
            } else {
                await addPet(currentPet);
                setNotification({ message: 'Pet added successfully!', visible: true });
            }
            onSave(currentPet); // Notify parent to update pets list
            onClose(); // Close the modal
            setTimeout(() => window.location.reload(), 2000); // Refresh the page after 2 seconds
        } catch (error) {
            console.error('Error updating/adding pet:', error);
        }
    };

    const handleDelete = async () => {
        try {
            if (currentPet._id) {
                await deletePet(currentPet._id);
                setNotification({ message: 'Pet deleted successfully!', visible: true });
                onSave(null); // Notify parent to update pets list
                onClose(); // Close the modal
                setTimeout(() => window.location.reload(), 2000); // Refresh the page after 2 seconds
            }
        } catch (error) {
            console.error('Error deleting pet:', error);
        }
    };

    return (
        <>
            <div className="modal modal-open">
                <div className="modal-box">
                    <div className="modal-header">
                        <h3 className="font-bold text-lg">{currentPet._id ? 'Update Pet Information' : 'Add New Pet'}</h3>
                        <button className="btn btn-sm btn-circle btn-ghost" onClick={() => { onClose(); window.location.reload(); }}>✕</button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-control">
                                <label className="label" htmlFor="formPetName">
                                    <span className="label-text">Name</span>
                                </label>
                                <input
                                    type="text"
                                    id="formPetName"
                                    name="name"
                                    className="input input-bordered"
                                    value={currentPet.name || ''}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-control">
                                <label className="label" htmlFor="formPetAge">
                                    <span className="label-text">Age</span>
                                </label>
                                <input
                                    type="number"
                                    id="formPetAge"
                                    name="age"
                                    className="input input-bordered"
                                    value={currentPet.age || ''}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-control">
                                <label className="label" htmlFor="formPetBreed">
                                    <span className="label-text">Breed</span>
                                </label>
                                <input
                                    type="text"
                                    id="formPetBreed"
                                    name="breed"
                                    className="input input-bordered"
                                    value={currentPet.breed || ''}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-control">
                                <label className="label" htmlFor="formPetType">
                                    <span className="label-text">Type</span>
                                </label>
                                <input
                                    type="text"
                                    id="formPetType"
                                    name="type"
                                    className="input input-bordered"
                                    value={currentPet.type || ''}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-control">
                                <label className="label" htmlFor="formPetDescription">
                                    <span className="label-text">Description</span>
                                </label>
                                <textarea
                                    id="formPetDescription"
                                    name="description"
                                    className="textarea textarea-bordered"
                                    value={currentPet.description || ''}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-control">
                                <label className="label" htmlFor="formPetImage">
                                    <span className="label-text">Image URL</span>
                                </label>
                                <input
                                    type="text"
                                    id="formPetImage"
                                    name="image"
                                    className="input input-bordered"
                                    value={currentPet.image || ''}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary mr-2" type="button" onClick={() => { onClose(); window.location.reload(); }}>
                                    Close
                                </button>
                                {currentPet._id && (
                                    <button className="btn btn-error mr-2" type="button" onClick={async () => {
                                        await handleDelete();
                                        onClose();
                                        window.location.reload();
                                    }}>
                                        Delete
                                    </button>
                                )}
                                <button className="btn btn-primary" type="submit" onClick={handleSubmit}>
                                    {currentPet._id ? 'Save Changes' : 'Add Pet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {notification.visible && (
                <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded">
                    {notification.message}
                </div>
            )}
        </>
    );
};

export default ManagePetsModal;
