import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const HireEmployee = () => {
  const [skills, setSkills] = useState([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const addSkill = () => {
    setSkills([...skills, { name: '', level: 'beginner', yearsOfExperience: 0, certifications: [], specialties: [] }]);
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkill = (index, field, value) => {
    const newSkills = [...skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    setSkills(newSkills);
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('phone', data.phone);
      formData.append('username', data.username);
      formData.append('password', data.password);
      formData.append('skills', JSON.stringify(skills));
      formData.append('preferredTaskTypes', JSON.stringify(data.preferredTaskTypes?.split(',').map(t => t.trim()) || []));
      formData.append('availability', JSON.stringify({
        monday: data.monday,
        tuesday: data.tuesday,
        wednesday: data.wednesday,
        thursday: data.thursday,
        friday: data.friday,
        saturday: data.saturday,
        sunday: data.sunday
      }));
      formData.append('workingHours', JSON.stringify({
        start: data.workingHoursStart,
        end: data.workingHoursEnd
      }));
      if (data.photo[0]) formData.append('photo', data.photo[0]);

      await axios.post('http://localhost:5000/api/workers/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Worker registered successfully');
      reset();
      setSkills([]);
    } catch (err) {
      toast.error('Failed to register worker');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-gray-800 p-8 rounded shadow w-full max-w-2xl"
      >
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
          Register Worker
        </h2>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Name"
              {...register('name', { required: 'Name is required' })}
              className={`w-full p-2 border rounded dark:bg-gray-700 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <input
              type="text"
              placeholder="Phone"
              {...register('phone', {
                required: 'Phone is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Invalid phone number',
                },
              })}
              className={`w-full p-2 border rounded dark:bg-gray-700 dark:text-white ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* Skills Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Skills</h3>
          {skills.map((skill, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border rounded">
              <div>
                <input
                  type="text"
                  placeholder="Skill Name"
                  value={skill.name}
                  onChange={(e) => updateSkill(index, 'name', e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <select
                  value={skill.level}
                  onChange={(e) => updateSkill(index, 'level', e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Years of Experience"
                  value={skill.yearsOfExperience}
                  onChange={(e) => updateSkill(index, 'yearsOfExperience', parseInt(e.target.value))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Certifications (comma-separated)"
                  value={skill.certifications.join(', ')}
                  onChange={(e) => updateSkill(index, 'certifications', e.target.value.split(',').map(c => c.trim()))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Specialties (comma-separated)"
                  value={skill.specialties.join(', ')}
                  onChange={(e) => updateSkill(index, 'specialties', e.target.value.split(',').map(s => s.trim()))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => removeSkill(index)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Remove Skill
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSkill}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Skill
          </button>
        </div>

        {/* Preferred Task Types */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Preferred Task Types</h3>
          <input
            type="text"
            placeholder="Preferred task types (comma-separated)"
            {...register('preferredTaskTypes')}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Availability */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Availability</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
              <label key={day} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register(day)}
                  className="form-checkbox"
                />
                <span className="text-gray-800 dark:text-white capitalize">{day}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Working Hours */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Working Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-800 dark:text-white mb-1">Start Time</label>
              <input
                type="time"
                {...register('workingHoursStart', { required: true })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-gray-800 dark:text-white mb-1">End Time</label>
              <input
                type="time"
                {...register('workingHoursEnd', { required: true })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Username"
              {...register('username', { required: 'Username is required' })}
              className={`w-full p-2 border rounded dark:bg-gray-700 dark:text-white ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
            )}
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              {...register('password', { required: 'Password is required' })}
              className={`w-full p-2 border rounded dark:bg-gray-700 dark:text-white ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>
        </div>

        {/* Photo Upload */}
        <div className="mb-6">
          <input
            type="file"
            accept="image/*"
            {...register('photo')}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-secondary text-white py-2 rounded hover:bg-green-700 transition"
        >
          Register
        </button>
      </form>
    </motion.div>
  );
};

export default HireEmployee;
