import './AbbreviationGuideModal.css';

interface AbbreviationGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const AbbreviationGuideModal = ({ open, onClose }: AbbreviationGuideModalProps) => {
  if (!open) return null;

  return (
    <div className="abbr-modal-overlay" onClick={onClose}>
      <div className="abbr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="abbr-modal-header">
          <h3>Abbreviation Guide</h3>
          <button
            type="button"
            className="abbr-modal-close"
            aria-label="Close abbreviation guide"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="abbr-modal-body">
          <p className="abbr-modal-intro">Use these codes when filling columns in the template. You can copy the code exactly as shown.</p>

          <div className="abbr-section">
            <h4>Quick Labels</h4>
            <div className="abbr-grid two-col">
              <div className="abbr-item"><span className="code">HH</span><span className="desc">Household</span></div>
              <div className="abbr-item"><span className="code">Fa</span><span className="desc">Father</span></div>
              <div className="abbr-item"><span className="code">Mo</span><span className="desc">Mother</span></div>
              <div className="abbr-item"><span className="code">Ca</span><span className="desc">Caregiver</span></div>
            </div>
          </div>

          <div className="abbr-section">
            <h4>NHTS (col D)</h4>
            <div className="abbr-grid">
              <div className="abbr-item"><span className="code">1</span><span className="desc">NHTS 4Ps</span></div>
              <div className="abbr-item"><span className="code">2</span><span className="desc">NHTS Non-4Ps</span></div>
              <div className="abbr-item"><span className="code">3</span><span className="desc">Non-NHTS</span></div>
            </div>
          </div>

          <div className="abbr-section">
            <h4>Indigenous (col E)</h4>
            <div className="abbr-grid">
              <div className="abbr-item"><span className="code">1</span><span className="desc">IP</span></div>
              <div className="abbr-item"><span className="code">2</span><span className="desc">Non-IP</span></div>
            </div>
          </div>

          <div className="abbr-section">
            <h4>Occupation (col AA)</h4>
            <div className="abbr-grid">
              <div className="abbr-item"><span className="code">1</span><span className="desc">Manager</span></div>
              <div className="abbr-item"><span className="code">2</span><span className="desc">Professional</span></div>
              <div className="abbr-item"><span className="code">3</span><span className="desc">Technician &amp; Associate Professionals</span></div>
              <div className="abbr-item"><span className="code">4</span><span className="desc">Clerical Support Workers</span></div>
              <div className="abbr-item"><span className="code">5</span><span className="desc">Service &amp; Sales Workers</span></div>
              <div className="abbr-item"><span className="code">6</span><span className="desc">Skilled agricultural/forestry/fishery workers</span></div>
              <div className="abbr-item"><span className="code">7</span><span className="desc">Craft &amp; related trade workers</span></div>
              <div className="abbr-item"><span className="code">8</span><span className="desc">Plant &amp; machine operators &amp; assemblers</span></div>
              <div className="abbr-item"><span className="code">9</span><span className="desc">Elementary occupations</span></div>
              <div className="abbr-item"><span className="code">10</span><span className="desc">Armed Forces Occupations</span></div>
              <div className="abbr-item"><span className="code">11</span><span className="desc">None</span></div>
            </div>
          </div>

          <div className="abbr-section">
            <h4>Educational Attainment (col AB)</h4>
            <div className="abbr-grid">
              <div className="abbr-item"><span className="code">N</span><span className="desc">None</span></div>
              <div className="abbr-item"><span className="code">EU</span><span className="desc">Elementary undergraduate</span></div>
              <div className="abbr-item"><span className="code">EG</span><span className="desc">Elementary graduate</span></div>
              <div className="abbr-item"><span className="code">HU</span><span className="desc">High school undergraduate</span></div>
              <div className="abbr-item"><span className="code">HG</span><span className="desc">High school graduate</span></div>
              <div className="abbr-item"><span className="code">CU</span><span className="desc">College undergraduate</span></div>
              <div className="abbr-item"><span className="code">CG</span><span className="desc">College graduate</span></div>
              <div className="abbr-item"><span className="code">V</span><span className="desc">Vocational</span></div>
              <div className="abbr-item"><span className="code">PG</span><span className="desc">Post graduate studies</span></div>
            </div>
          </div>

          <div className="abbr-section">
            <h4>Toilet (col AD)</h4>
            <div className="abbr-grid">
              <div className="abbr-item"><span className="code">1</span><span className="desc">Improved sanitation</span></div>
              <div className="abbr-item"><span className="code">2</span><span className="desc">Shared facility</span></div>
              <div className="abbr-item"><span className="code">3</span><span className="desc">Unimproved</span></div>
              <div className="abbr-item"><span className="code">4</span><span className="desc">Open defecation</span></div>
            </div>
          </div>

          <div className="abbr-section">
            <h4>Water Source (col AE)</h4>
            <div className="abbr-grid">
              <div className="abbr-item"><span className="code">1</span><span className="desc">Improved source</span></div>
              <div className="abbr-item"><span className="code">2</span><span className="desc">Unimproved source</span></div>
            </div>
          </div>

          <div className="abbr-section">
            <h4>Food Production (col AF)</h4>
            <div className="abbr-grid">
              <div className="abbr-item"><span className="code">VG</span><span className="desc">Vegetable Garden</span></div>
              <div className="abbr-item"><span className="code">FT</span><span className="desc">Fruit</span></div>
              <div className="abbr-item"><span className="code">PL</span><span className="desc">Poultry/Livestock</span></div>
              <div className="abbr-item"><span className="code">FP</span><span className="desc">Fish pond</span></div>
              <div className="abbr-item"><span className="code">NA</span><span className="desc">None</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbbreviationGuideModal;
