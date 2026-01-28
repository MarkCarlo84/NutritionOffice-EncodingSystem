import { useState } from 'react';
import axios from 'axios';
import './EncodeRecord.css';

const BARANGAYS = [
  'Baclaran',
  'Banay-Banay',
  'Banlic',
  'Bigaa',
  'Butong',
  'Casile',
  'Diezmo',
  'Pulo',
  'Sala',
  'San Isidro',
  'Poblacion Uno',
  'Poblacion Dos',
  'Poblacion Tres',
];

interface HouseholdMember {
  id?: number;
  name: string;
  role: 'father' | 'mother' | 'caregiver';
  occupation: number | null;
  educational_attainment: string | null;
  practicing_family_planning: boolean;
}

const EncodeRecord = () => {
  const [formData, setFormData] = useState({
    // Location
    purok_sito: '',
    barangay: '',
    municipality_city: 'Cabuyao',
    province: 'Laguna',
    
    // Household Identification
    household_number: '',
    family_living_in_house: 0,
    number_of_members: 0,
    nhts_household_group: null as number | null,
    indigenous_group: null as number | null,
    
    // Age Classifications
    newborn_male: 0,
    newborn_female: 0,
    infant_male: 0,
    infant_female: 0,
    under_five_male: 0,
    under_five_female: 0,
    children_male: 0,
    children_female: 0,
    adolescence_male: 0,
    adolescence_female: 0,
    pregnant: 0,
    adolescent_pregnant: 0,
    post_partum: 0,
    women_15_49_not_pregnant: 0,
    adult_male: 0,
    adult_female: 0,
    senior_citizen_male: 0,
    senior_citizen_female: 0,
    pwd_male: 0,
    pwd_female: 0,
    
    // Facilities
    toilet_type: null as number | null,
    water_source: null as number | null,
    food_production_activity: null as string | null,
    
    // Practices
    couple_practicing_family_planning: null as boolean | null,
    using_iodized_salt: null as boolean | null,
    using_iron_fortified_rice: null as boolean | null,
  });

  const [members, setMembers] = useState<HouseholdMember[]>([
    {
      name: '',
      role: 'father',
      occupation: null,
      educational_attainment: null,
      practicing_family_planning: false,
    },
    {
      name: '',
      role: 'mother',
      occupation: null,
      educational_attainment: null,
      practicing_family_planning: false,
    },
    {
      name: '',
      role: 'caregiver',
      occupation: null,
      educational_attainment: null,
      practicing_family_planning: false,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;
    
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'radio') {
      if (name === 'nhts_household_group' || name === 'indigenous_group') {
        processedValue = value === '' ? null : parseInt(value);
      } else {
        processedValue = value === 'true' ? true : value === 'false' ? false : null;
      }
    } else if (type === 'number') {
      processedValue = value === '' ? 0 : parseInt(value);
    } else {
      processedValue = value === '' ? null : value;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleReset = () => {
    setFormData({
      purok_sito: '',
      barangay: '',
      municipality_city: 'Cabuyao',
      province: 'Laguna',
      household_number: '',
      family_living_in_house: 0,
      number_of_members: 0,
      nhts_household_group: null,
      indigenous_group: null,
      newborn_male: 0,
      newborn_female: 0,
      infant_male: 0,
      infant_female: 0,
      under_five_male: 0,
      under_five_female: 0,
      children_male: 0,
      children_female: 0,
      adolescence_male: 0,
      adolescence_female: 0,
      pregnant: 0,
      adolescent_pregnant: 0,
      post_partum: 0,
      women_15_49_not_pregnant: 0,
      adult_male: 0,
      adult_female: 0,
      senior_citizen_male: 0,
      senior_citizen_female: 0,
      pwd_male: 0,
      pwd_female: 0,
      toilet_type: null,
      water_source: null,
      food_production_activity: null,
      couple_practicing_family_planning: null,
      using_iodized_salt: null,
      using_iron_fortified_rice: null,
    });
      setMembers([
        {
          name: '',
          role: 'father',
          occupation: null,
          educational_attainment: null,
          practicing_family_planning: false,
        },
        {
          name: '',
          role: 'mother',
          occupation: null,
          educational_attainment: null,
          practicing_family_planning: false,
        },
        {
          name: '',
          role: 'caregiver',
          occupation: null,
          educational_attainment: null,
          practicing_family_planning: false,
        },
      ]);
      setMessage(null);
  };

  const handleMemberChange = (index: number, field: keyof HouseholdMember, value: any) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const addMember = () => {
    setMembers([...members, {
      name: '',
      role: 'father',
      occupation: null,
      educational_attainment: null,
      practicing_family_planning: false,
    }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Convert radio button values to booleans for API
      const submitData = {
        ...formData,
        couple_practicing_family_planning: formData.couple_practicing_family_planning === true,
        using_iodized_salt: formData.using_iodized_salt === true,
        using_iron_fortified_rice: formData.using_iron_fortified_rice === true,
        members: members.filter(m => m.name.trim() !== '').map(m => ({
          ...m,
          practicing_family_planning: m.practicing_family_planning,
        })).filter(m => m.name.trim() !== ''),
      };
      
      await axios.post('http://localhost:8000/api/households', submitData);
      
      setMessage({ type: 'success', text: 'Household record encoded successfully!' });
      // Reset form
      setFormData({
        purok_sito: '',
        barangay: '',
        municipality_city: 'Cabuyao',
        province: 'Laguna',
        household_number: '',
        family_living_in_house: 0,
        number_of_members: 0,
        nhts_household_group: null,
        indigenous_group: null,
        newborn_male: 0,
        newborn_female: 0,
        infant_male: 0,
        infant_female: 0,
        under_five_male: 0,
        under_five_female: 0,
        children_male: 0,
        children_female: 0,
        adolescence_male: 0,
        adolescence_female: 0,
        pregnant: 0,
        adolescent_pregnant: 0,
        post_partum: 0,
        women_15_49_not_pregnant: 0,
        adult_male: 0,
        adult_female: 0,
        senior_citizen_male: 0,
        senior_citizen_female: 0,
        pwd_male: 0,
        pwd_female: 0,
        toilet_type: null,
        water_source: null,
        food_production_activity: null,
        couple_practicing_family_planning: null,
        using_iodized_salt: null,
        using_iron_fortified_rice: null,
      });
      setMembers([
        {
          name: '',
          role: 'father',
          occupation: null,
          educational_attainment: null,
          practicing_family_planning: false,
        },
        {
          name: '',
          role: 'mother',
          occupation: null,
          educational_attainment: null,
          practicing_family_planning: false,
        },
        {
          name: '',
          role: 'caregiver',
          occupation: null,
          educational_attainment: null,
          practicing_family_planning: false,
        },
      ]);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error encoding household record' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="encode-record">
      <div className="form-header">
        <h1>BNS Form No. 1A - HOUSEHOLD PROFILE</h1>
        <p>Philippines Plan of Action for Nutrition | Edited Date</p>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="household-form">
        {/* Location Section */}
        <section className="form-section">
          <h2 className="section-heading">Location Information</h2>
          <div className="location-grid">
            <div className="form-group">
              <label>Purok/Sitio:</label>
              <input
                type="text"
                name="purok_sito"
                value={formData.purok_sito}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Barangay:</label>
              <select
                name="barangay"
                value={formData.barangay}
                onChange={handleInputChange}
                required
              >
                <option value="">Select barangay</option>
                {BARANGAYS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Municipality/City:</label>
              <input
                type="text"
                name="municipality_city"
                value={formData.municipality_city}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Province:</label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </section>

        {/* Household Identification */}
        <section className="form-section">
          <h2 className="section-heading">Location Information</h2>
          <div className="household-id-grid">
            <div className="form-group">
              <label>No. of HouseHold No.</label>
              <input
                type="text"
                name="household_number"
                value={formData.household_number}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Number of Family living in the House:</label>
              <input
                type="number"
                name="family_living_in_house"
                value={formData.family_living_in_house}
                onChange={handleInputChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>No. of HouseHold Member:</label>
              <input
                type="number"
                name="number_of_members"
                value={formData.number_of_members}
                onChange={handleInputChange}
                min="0"
              />
            </div>
          </div>
          
          <div className="radio-group-container">
            <div className="radio-group">
              <label className="radio-group-label">NHTS Household:</label>
              <div className="radio-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="nhts_household_group"
                    value="1"
                    checked={formData.nhts_household_group === 1}
                    onChange={handleInputChange}
                  />
                  <span>1 - NHTS 4Ps</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="nhts_household_group"
                    value="2"
                    checked={formData.nhts_household_group === 2}
                    onChange={handleInputChange}
                  />
                  <span>2 - NHTS Non- 4Ps</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="nhts_household_group"
                    value="3"
                    checked={formData.nhts_household_group === 3}
                    onChange={handleInputChange}
                  />
                  <span>3 - Non NTHS</span>
                </label>
              </div>
            </div>
            
            <div className="radio-group">
              <label className="radio-group-label">Indigenous Group:</label>
              <div className="radio-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="indigenous_group"
                    value="1"
                    checked={formData.indigenous_group === 1}
                    onChange={handleInputChange}
                  />
                  <span>1 - IP</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="indigenous_group"
                    value="2"
                    checked={formData.indigenous_group === 2}
                    onChange={handleInputChange}
                  />
                  <span>2 - Non IP</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Age Classifications */}
        <section className="form-section">
          <h2 className="section-heading">Number of Family Members by Age Classification / Health Risk Group</h2>
          <div className="age-grid">
            <div className="age-group">
              <h3>Newborn (0-28 days)</h3>
              <div className="form-group">
                <label>Male (C6)</label>
                <input
                  type="number"
                  name="newborn_male"
                  value={formData.newborn_male}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Female (C7)</label>
                <input
                  type="number"
                  name="newborn_female"
                  value={formData.newborn_female}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className="age-group">
              <h3>Infant (29 days - 11 months)</h3>
              <div className="form-group">
                <label>Male (C8)</label>
                <input
                  type="number"
                  name="infant_male"
                  value={formData.infant_male}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Female (C9)</label>
                <input
                  type="number"
                  name="infant_female"
                  value={formData.infant_female}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className="age-group">
              <h3>Under-five (1-4 years old)</h3>
              <div className="form-group">
                <label>Male (C10)</label>
                <input
                  type="number"
                  name="under_five_male"
                  value={formData.under_five_male}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Female (C11)</label>
                <input
                  type="number"
                  name="under_five_female"
                  value={formData.under_five_female}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className="age-group">
              <h3>Children (5-9 y.o.)</h3>
              <div className="form-group">
                <label>Male (C12)</label>
                <input
                  type="number"
                  name="children_male"
                  value={formData.children_male}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Female (C13)</label>
                <input
                  type="number"
                  name="children_female"
                  value={formData.children_female}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className="age-group">
              <h3>Adolescence (10-19 y.o.)</h3>
              <div className="form-group">
                <label>Male (C14)</label>
                <input
                  type="number"
                  name="adolescence_male"
                  value={formData.adolescence_male}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Female (C15)</label>
                <input
                  type="number"
                  name="adolescence_female"
                  value={formData.adolescence_female}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className="age-group">
              <h3>Adult (20-59 y.o.)</h3>
              <div className="form-group">
                <label>Male (C20)</label>
                <input
                  type="number"
                  name="adult_male"
                  value={formData.adult_male}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Female (C21)</label>
                <input
                  type="number"
                  name="adult_female"
                  value={formData.adult_female}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className="age-group">
              <h3>Senior Citizens</h3>
              <div className="form-group">
                <label>Male (C22)</label>
                <input
                  type="number"
                  name="senior_citizen_male"
                  value={formData.senior_citizen_male}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Female (C23)</label>
                <input
                  type="number"
                  name="senior_citizen_female"
                  value={formData.senior_citizen_female}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Health Risk Groups */}
          <div className="health-risk-section">
            <h3>Health Risk Groups</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Pregnant (C16)</label>
                <input
                  type="number"
                  name="pregnant"
                  value={formData.pregnant}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Adolescent Pregnant (C17)</label>
                <input
                  type="number"
                  name="adolescent_pregnant"
                  value={formData.adolescent_pregnant}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Post-Partum (C18)</label>
                <input
                  type="number"
                  name="post_partum"
                  value={formData.post_partum}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Women 15-49 not pregnant & non PP (C19)</label>
                <input
                  type="number"
                  name="women_15_49_not_pregnant"
                  value={formData.women_15_49_not_pregnant}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* PWD */}
          <div className="pwd-section">
            <h3>Person With Disability</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Male (C24)</label>
                <input
                  type="number"
                  name="pwd_male"
                  value={formData.pwd_male}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Female (C25)</label>
                <input
                  type="number"
                  name="pwd_female"
                  value={formData.pwd_female}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Individual/Parental Information */}
        <section className="form-section">
          <h2 className="section-heading section-heading-no-line">Individual/Parental Information</h2>
          
          {/* Father Information */}
          <div className="member-section">
            <h3 className="member-section-heading">Father Information:</h3>
            {members.map((member, index) => {
              if (member.role !== 'father') return null;
              return (
                <div key={index} className="member-fields">
                    <div className="form-group full-width">
                      <label>Name of the Father:</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Occupation:</label>
                      <select
                        value={member.occupation || ''}
                        onChange={(e) => handleMemberChange(index, 'occupation', e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">Select...</option>
                        <option value="1">1 - Manager</option>
                        <option value="2">2 - Professional</option>
                        <option value="3">3 - Technician & Associate Professionals</option>
                        <option value="4">4 - Clerical Support Workers</option>
                        <option value="5">5 - Service and Sales Worker</option>
                        <option value="6">6 - Skilled agricultural, forestry and fishery workers</option>
                        <option value="7">7 - Craft and related trade workers</option>
                        <option value="8">8 - Plant and machine operators and assemblers</option>
                        <option value="9">9 - Elementary occupations</option>
                        <option value="10">10 - Armed Forces Occupations</option>
                        <option value="11">11 - None</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Educational Attainment:</label>
                      <select
                        value={member.educational_attainment || ''}
                        onChange={(e) => handleMemberChange(index, 'educational_attainment', e.target.value || null)}
                      >
                        <option value="">Select...</option>
                        <option value="N">N - None</option>
                        <option value="EU">EU - Elementary undergraduate</option>
                        <option value="EG">EG - Elementary graduate</option>
                        <option value="HU">HU - High school undergraduate</option>
                        <option value="HG">HG - High school graduate</option>
                        <option value="CU">CU - College undergraduate</option>
                        <option value="CG">CG - College graduate</option>
                        <option value="V">V - Vocational</option>
                        <option value="PG">PG - Post graduate studies</option>
                      </select>
                    </div>
                </div>
              );
            })}
          </div>

          {/* Mother Information */}
          <div className="member-section">
            <h3 className="member-section-heading">Mother Information:</h3>
            {members.map((member, index) => {
              if (member.role !== 'mother') return null;
              return (
                <div key={index} className="member-fields">
                    <div className="form-group full-width">
                      <label>Name of the Mother:</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Occupation:</label>
                      <select
                        value={member.occupation || ''}
                        onChange={(e) => handleMemberChange(index, 'occupation', e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">Select...</option>
                        <option value="1">1 - Manager</option>
                        <option value="2">2 - Professional</option>
                        <option value="3">3 - Technician & Associate Professionals</option>
                        <option value="4">4 - Clerical Support Workers</option>
                        <option value="5">5 - Service and Sales Worker</option>
                        <option value="6">6 - Skilled agricultural, forestry and fishery workers</option>
                        <option value="7">7 - Craft and related trade workers</option>
                        <option value="8">8 - Plant and machine operators and assemblers</option>
                        <option value="9">9 - Elementary occupations</option>
                        <option value="10">10 - Armed Forces Occupations</option>
                        <option value="11">11 - None</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Educational Attainment:</label>
                      <select
                        value={member.educational_attainment || ''}
                        onChange={(e) => handleMemberChange(index, 'educational_attainment', e.target.value || null)}
                      >
                        <option value="">Select...</option>
                        <option value="N">N - None</option>
                        <option value="EU">EU - Elementary undergraduate</option>
                        <option value="EG">EG - Elementary graduate</option>
                        <option value="HU">HU - High school undergraduate</option>
                        <option value="HG">HG - High school graduate</option>
                        <option value="CU">CU - College undergraduate</option>
                        <option value="CG">CG - College graduate</option>
                        <option value="V">V - Vocational</option>
                        <option value="PG">PG - Post graduate studies</option>
                      </select>
                    </div>
                </div>
              );
            })}
          </div>

          {/* Caregiver Information */}
          <div className="member-section">
            <h3 className="member-section-heading">Caregiver Information:</h3>
            {members.map((member, index) => {
              if (member.role !== 'caregiver') return null;
              return (
                <div key={index} className="member-fields">
                    <div className="form-group full-width">
                      <label>Name of the Caregiver:</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Occupation:</label>
                      <select
                        value={member.occupation || ''}
                        onChange={(e) => handleMemberChange(index, 'occupation', e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">Select...</option>
                        <option value="1">1 - Manager</option>
                        <option value="2">2 - Professional</option>
                        <option value="3">3 - Technician & Associate Professionals</option>
                        <option value="4">4 - Clerical Support Workers</option>
                        <option value="5">5 - Service and Sales Worker</option>
                        <option value="6">6 - Skilled agricultural, forestry and fishery workers</option>
                        <option value="7">7 - Craft and related trade workers</option>
                        <option value="8">8 - Plant and machine operators and assemblers</option>
                        <option value="9">9 - Elementary occupations</option>
                        <option value="10">10 - Armed Forces Occupations</option>
                        <option value="11">11 - None</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Educational Attainment:</label>
                      <select
                        value={member.educational_attainment || ''}
                        onChange={(e) => handleMemberChange(index, 'educational_attainment', e.target.value || null)}
                      >
                        <option value="">Select...</option>
                        <option value="N">N - None</option>
                        <option value="EU">EU - Elementary undergraduate</option>
                        <option value="EG">EG - Elementary graduate</option>
                        <option value="HU">HU - High school undergraduate</option>
                        <option value="HG">HG - High school graduate</option>
                        <option value="CU">CU - College undergraduate</option>
                        <option value="CG">CG - College graduate</option>
                        <option value="V">V - Vocational</option>
                        <option value="PG">PG - Post graduate studies</option>
                      </select>
                    </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Household Practices */}
        <section className="form-section">
          <h2 className="section-heading">Household Practices:</h2>
          
          <div className="radio-group-container">
            <div className="radio-group">
              <label className="radio-group-label">Couple Practicing Family Planning:</label>
              <div className="radio-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="couple_practicing_family_planning"
                    value="true"
                    checked={formData.couple_practicing_family_planning === true}
                    onChange={handleInputChange}
                  />
                  <span>Yes</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="couple_practicing_family_planning"
                    value="false"
                    checked={formData.couple_practicing_family_planning === false}
                    onChange={handleInputChange}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          <div className="practices-grid">
            <div className="form-group">
              <label>Toilet Type:</label>
              <select
                name="toilet_type"
                value={formData.toilet_type || ''}
                onChange={handleInputChange}
              >
                <option value="">Select...</option>
                <option value="1">1 - Improved sanitation</option>
                <option value="2">2 - Shared facility</option>
                <option value="3">3 - Unimproved</option>
                <option value="4">4 - Open defecation</option>
              </select>
            </div>
            <div className="form-group">
              <label>Water Source:</label>
              <select
                name="water_source"
                value={formData.water_source || ''}
                onChange={handleInputChange}
              >
                <option value="">Select...</option>
                <option value="1">1 - Improved source</option>
                <option value="2">2 - Unimproved source</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Food Production Activity:</label>
              <select
                name="food_production_activity"
                value={formData.food_production_activity || ''}
                onChange={handleInputChange}
              >
                <option value="">Select...</option>
                <option value="VG">VG - Vegetable Garden</option>
                <option value="FT">FT - Fruit</option>
                <option value="PL">PL - Poultry Livestock</option>
                <option value="FP">FP - Fish pond</option>
                <option value="NA">NA - None</option>
              </select>
            </div>
          </div>

          <div className="radio-group-container">
            <div className="radio-group">
              <label className="radio-group-label">Household using Iodized Salt:</label>
              <div className="radio-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="using_iodized_salt"
                    value="true"
                    checked={formData.using_iodized_salt === true}
                    onChange={handleInputChange}
                  />
                  <span>Yes</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="using_iodized_salt"
                    value="false"
                    checked={formData.using_iodized_salt === false}
                    onChange={handleInputChange}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
            
            <div className="radio-group">
              <label className="radio-group-label">Household using Iron-Fortified Rice:</label>
              <div className="radio-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="using_iron_fortified_rice"
                    value="true"
                    checked={formData.using_iron_fortified_rice === true}
                    onChange={handleInputChange}
                  />
                  <span>Yes</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="using_iron_fortified_rice"
                    value="false"
                    checked={formData.using_iron_fortified_rice === false}
                    onChange={handleInputChange}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Household Profile'}
          </button>
          <button type="button" onClick={handleReset} className="reset-btn">
            Reset Form
          </button>
          <button type="button" onClick={() => window.history.back()} className="cancel-btn">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EncodeRecord;
