import { useState, useRef, useCallback, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import client from '../api/client';
import SpeechInput from '../components/SpeechInput';
import { useToast } from '../components/NotificationCenter';
import { useNotificationCenter } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

// ── Location data ──────────────────────────────────────────────────────────────
const LOCATION_DATA = {
  India : {
  'Tamil Nadu': ['Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri','Dindigul','Erode','Kallakurichi','Kanchipuram','Kanyakumari','Karur','Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai','Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi','Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli','Tirupathur','Tiruppur','Tiruvallur','Tiruvannamalai','Tiruvarur','Vellore','Viluppuram','Virudhunagar'],
  'Karnataka': ['Bagalkot','Ballari','Belagavi','Bengaluru Rural','Bengaluru Urban','Bidar','Chamarajanagar','Chikkaballapur','Chikkamagaluru','Chitradurga','Dakshina Kannada','Davanagere','Dharwad','Gadag','Hassan','Haveri','Kalaburagi','Kodagu','Kolar','Koppal','Mandya','Mysuru','Raichur','Ramanagara','Shivamogga','Tumakuru','Udupi','Uttara Kannada','Vijayapura','Yadgir','Vijayanagara'],
  'Maharashtra': ['Mumbai','Mumbai Suburban','Pune','Nagpur','Nashik','Aurangabad','Solapur','Kolhapur','Thane','Amravati','Nanded','Jalgaon','Sangli'],
  'Delhi': ['New Delhi','Central Delhi','North Delhi','South Delhi','East Delhi','West Delhi','North East Delhi','North West Delhi','South East Delhi','South West Delhi','Shahdara'],
  'Uttar Pradesh': ['Lucknow','Kanpur Nagar','Agra','Varanasi','Prayagraj','Meerut','Noida (Gautam Buddha Nagar)','Ghaziabad','Bareilly','Aligarh','Moradabad'],
  'West Bengal': ['Kolkata','Howrah','Durgapur','Asansol','Siliguri','Darjeeling','Malda','Murshidabad'],
  'Rajasthan': ['Jaipur','Jodhpur','Udaipur','Kota','Ajmer','Bikaner','Alwar','Bharatpur','Sikar'],
  'Gujarat': ['Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Gandhinagar','Junagadh','Kutch'],
  'Telangana': ['Hyderabad','Warangal','Nizamabad','Karimnagar','Khammam','Mahabubnagar','Adilabad'],
  'Kerala': ['Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam','Kannur','Alappuzha','Palakkad'],
  'Andhra Pradesh': ['Alluri Sitharama Raju','Anakapalli','Anantapur','Annamayya','Bapatla','Chittoor','East Godavari','Eluru','Guntur','Kakinada','Konaseema','Krishna','Kurnool','Nandyal','Nellore','NTR','Palnadu','Parvathipuram Manyam','Prakasam','Tirupati','Srikakulam','Visakhapatnam','Vizianagaram','West Godavari','YSR Kadapa'],
  'Punjab': ['Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Mohali','Pathankot'],
  'Haryana': ['Gurugram','Faridabad','Panipat','Ambala','Hisar','Rohtak','Karnal','Sonipat'],
  'Bihar': ['Patna','Gaya','Bhagalpur','Muzaffarpur','Darbhanga','Purnia','Arrah'],
  'Madhya Pradesh': ['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Rewa'],
  'Odisha': ['Bhubaneswar','Cuttack','Rourkela','Berhampur','Sambalpur','Puri'],
  'Assam': ['Guwahati','Dibrugarh','Silchar','Jorhat','Nagaon'],
  'Jharkhand': ['Ranchi','Jamshedpur','Dhanbad','Bokaro','Deoghar'],
  'Chhattisgarh': ['Raipur','Bhilai','Bilaspur','Korba','Durg'],
  'Uttarakhand': ['Dehradun','Haridwar','Nainital','Roorkee','Haldwani'],
  'Himachal Pradesh': ['Shimla','Mandi','Kullu','Dharamshala','Solan'],
  'Goa': ['North Goa','South Goa'],
  'Manipur': ['Imphal East','Imphal West','Thoubal','Churachandpur'],
  'Meghalaya': ['Shillong','Tura','Jowai'],
  'Tripura': ['Agartala','Udaipur','Dharmanagar'],
  'Nagaland': ['Kohima','Dimapur','Mokokchung'],
  'Arunachal Pradesh': ['Itanagar','Tawang','Ziro','Pasighat'],
  'Mizoram': ['Aizawl','Lunglei','Champhai'],
  'Sikkim': ['Gangtok','Namchi','Gyalshing'],
  'Andaman and Nicobar Islands': ['Port Blair','Car Nicobar'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman','Diu','Silvassa'],
  'Jammu and Kashmir': ['Srinagar','Jammu','Anantnag','Baramulla'],
  'Ladakh': ['Leh','Kargil'],
  'Lakshadweep': ['Kavaratti'],
  'Puducherry': ['Puducherry','Karaikal','Mahe','Yanam']
},
  'United States': { California: ['Los Angeles','San Francisco','San Diego','San Jose','Sacramento'], Texas: ['Houston','Dallas','Austin','San Antonio','Fort Worth'], 'New York': ['New York City','Buffalo','Rochester','Albany','Syracuse'], Florida: ['Miami','Orlando','Tampa','Jacksonville','Tallahassee'], Illinois: ['Chicago','Aurora','Naperville','Joliet','Rockford'] },
  'United Kingdom': { England: ['London','Manchester','Birmingham','Leeds','Liverpool','Bristol','Sheffield'], Scotland: ['Edinburgh','Glasgow','Aberdeen','Dundee','Inverness'], Wales: ['Cardiff','Swansea','Newport','Bangor'] },
  Canada: { Ontario: ['Toronto','Ottawa','Mississauga','Brampton','Hamilton'], 'British Columbia': ['Vancouver','Victoria','Surrey','Burnaby','Richmond'], Quebec: ['Montreal','Quebec City','Laval','Gatineau'], Alberta: ['Calgary','Edmonton','Red Deer','Lethbridge'] },
  Australia: { 'New South Wales': ['Sydney','Newcastle','Wollongong','Canberra'], Victoria: ['Melbourne','Geelong','Ballarat','Bendigo'], Queensland: ['Brisbane','Gold Coast','Sunshine Coast','Townsville'], 'Western Australia': ['Perth','Fremantle','Bunbury','Geraldton'] },
  'Sri Lanka': { 'Western Province': ['Colombo','Negombo','Kalutara'], 'Central Province': ['Kandy','Matale','Nuwara Eliya'], 'Southern Province': ['Galle','Matara','Hambantota'] },
  Singapore: { Singapore: ['Singapore'] },
  Malaysia: { 'Kuala Lumpur': ['Kuala Lumpur'], Selangor: ['Shah Alam','Petaling Jaya','Subang Jaya','Klang'], Penang: ['George Town','Butterworth'], Johor: ['Johor Bahru','Muar','Batu Pahat'] },
};

const COUNTRIES = Object.keys(LOCATION_DATA).sort();

const COURSES = [
  'B.E - Computer Science and Engineering',
  'B.E - Computer Science and Engineering (Cyber Security)',
  'B.E - Computer Science and Engineering (Artificial Intelligence & Machine Learning)',
  'B.E - Civil Engineering',
  'B.E - Electronics and Communication Engineering',
  'B.E - Electronics Engineering (VLSI Design and Technology)',
  'B.E - Electrical and Electronics Engineering',
  'B.E - Mechanical Engineering',
  'B.E - Mechatronics Engineering',
  'B.Tech - Information Technology',
  'B.Tech - Artificial Intelligence and Data Science',
  'B.Arch - Architecture',
  'MBA - Master of Business Administration',
  'M.Arch - Urban Design',
];

const INITIAL = {
  aadhaar: '', studentName: '', gender: '', phone: '', email: '', parentsPhone: '',
  institution: '', marks10: '', marks12: '', cutoffMark: '',
  address: '', country: '', state: '', city: '', course: '',
};

function validate(f, photo) {
  const e = {};
  if (!/^\d{12}$/.test(f.aadhaar))                     e.aadhaar      = 'Must be exactly 12 digits.';
  if (!f.studentName.trim())                            e.studentName  = 'Student name is required.';
  if (!f.gender)                                        e.gender       = 'Gender is required.';
  if (!/^\d{10}$/.test(f.phone))                        e.phone        = 'Must be exactly 10 digits.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))     e.email        = 'Enter a valid email address.';
  if (f.parentsPhone && !/^\d{10}$/.test(f.parentsPhone)) e.parentsPhone = 'Must be exactly 10 digits.';
  if (!f.institution.trim())                            e.institution  = 'Institution name is required.';
  if (!f.marks10.trim())                                e.marks10      = '10th marks/percentage is required.';
  if (!f.marks12.trim())                                e.marks12      = '12th marks/percentage is required.';
  if (!f.address.trim())                                e.address      = 'Address is required.';
  if (!f.country)                                       e.country      = 'Country is required.';
  if (!f.state)                                         e.state        = 'State is required.';
  if (!f.city)                                          e.city         = 'City is required.';
  if (!f.course)                                        e.course       = 'Course is required.';
  if (!photo)                                           e.photo        = 'Profile photo is required.';
  return e;
}

// ── Shared UI helpers ──────────────────────────────────────────────────────────
function Field({ label, error, required = true, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
        {!required && <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 animate-fade-in">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (err) =>
  `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all
  text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
  ${err ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-[#0f1117]'}`;

const selectCls = (err, disabled) =>
  `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all appearance-none
  text-gray-900 dark:text-white bg-white dark:bg-[#0f1117]
  ${err ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20' : disabled ? 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/3 text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`;

function SectionHeader({ step, title, icon }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100 dark:border-white/5">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
        {step}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h3 className="font-bold text-gray-800 dark:text-white text-base">{title}</h3>
      </div>
    </div>
  );
}

// ── Image Crop Modal ───────────────────────────────────────────────────────────
function CropModal({ src, onDone, onCancel }) {
  const canvasRef = useRef(null);
  const imgRef    = useRef(null);
  const [crop, setCrop]   = useState({ x: 0, y: 0, size: 200 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [imgNatural, setImgNatural] = useState({ w: 1, h: 1 });
  const [displaySize, setDisplaySize] = useState({ w: 300, h: 300 });

  const PREVIEW = 300;

  const onImgLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const ratio = Math.min(PREVIEW / img.naturalWidth, PREVIEW / img.naturalHeight);
    const dw = Math.round(img.naturalWidth * ratio);
    const dh = Math.round(img.naturalHeight * ratio);
    setDisplaySize({ w: dw, h: dh });
    setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
    const initSize = Math.min(dw, dh, 200);
    setCrop({ x: Math.round((dw - initSize) / 2), y: Math.round((dh - initSize) / 2), size: initSize });
  }, []);

  const clamp = useCallback((val, min, max) => Math.max(min, Math.min(max, val)), []);

  const onMouseDown = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDragging(true);
    setDragStart({ mx: e.clientX, my: e.clientY, cx: crop.x, cy: crop.y });
  };

  const onMouseMove = useCallback((e) => {
    if (!dragging || !dragStart) return;
    const dx = e.clientX - dragStart.mx;
    const dy = e.clientY - dragStart.my;
    setCrop((c) => ({
      ...c,
      x: clamp(dragStart.cx + dx, 0, displaySize.w - c.size),
      y: clamp(dragStart.cy + dy, 0, displaySize.h - c.size),
    }));
  }, [dragging, dragStart, displaySize, clamp]);

  const onMouseUp = () => { setDragging(false); setDragStart(null); };

  const onResize = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setCrop((c) => ({
      size: newSize,
      x: clamp(c.x, 0, displaySize.w - newSize),
      y: clamp(c.y, 0, displaySize.h - newSize),
    }));
  };

  const handleDone = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width  = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const scaleX = imgNatural.w / displaySize.w;
    const scaleY = imgNatural.h / displaySize.h;
    ctx.drawImage(
      img,
      crop.x * scaleX, crop.y * scaleY,
      crop.size * scaleX, crop.size * scaleY,
      0, 0, 400, 400
    );
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      const url  = canvas.toDataURL('image/jpeg', 0.92);
      onDone(file, url);
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 w-full max-w-sm animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Crop Profile Photo</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Drag the box to reposition. Use the slider to resize.</p>
          <div
            className="relative mx-auto overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 select-none cursor-move"
            style={{ width: displaySize.w, height: displaySize.h }}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <img
              ref={imgRef}
              src={src}
              alt="crop"
              onLoad={onImgLoad}
              draggable={false}
              style={{ width: displaySize.w, height: displaySize.h, display: 'block' }}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            {/* Crop window */}
            <div
              className="absolute border-2 border-white shadow-lg cursor-move"
              style={{ left: crop.x, top: crop.y, width: crop.size, height: crop.size, background: 'transparent', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}
              onMouseDown={onMouseDown}
            >
              {/* Corner handles */}
              {['top-0 left-0','top-0 right-0','bottom-0 left-0','bottom-0 right-0'].map((pos) => (
                <div key={pos} className={`absolute w-3 h-3 bg-white rounded-sm ${pos}`} />
              ))}
              {/* Rule-of-thirds grid */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/20" />
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Crop size: {crop.size}px</label>
            <input
              type="range"
              min={80}
              max={Math.min(displaySize.w, displaySize.h)}
              value={crop.size}
              onChange={onResize}
              className="w-full accent-indigo-500"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleDone}
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all">
              ✓ Apply Crop
            </button>
            <button onClick={onCancel}
              className="px-4 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Document slot component ────────────────────────────────────────────────────
function DocSlot({ index, label, required, file, onFile, onRemove }) {
  const inputRef = useRef(null);
  const isPdf = file && file.type.includes('pdf');
  const isImg = file && file.type.startsWith('image');

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { alert(`"${f.name}" exceeds 5MB limit.`); return; }
    onFile(index, f);
    e.target.value = '';
  };

  return (
    <div className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all
      ${file
        ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
        : required
          ? 'border-dashed border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10'
          : 'border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3'
      }`}>
      <input ref={inputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleChange} />

      {/* Slot number / status icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
        ${file ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
               : required ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>
        {file ? '✓' : index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
          {label}
          {required && !file && <span className="ml-1 text-red-500 text-[10px]">Required</span>}
          {!required && !file && <span className="ml-1 text-gray-400 text-[10px]">Optional</span>}
        </p>
        {file ? (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{file.name} · {(file.size / 1024).toFixed(0)} KB</p>
        ) : (
          <p className="text-[11px] text-gray-400">PDF, JPG, PNG, DOC · max 5MB</p>
        )}
      </div>

      {file ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-lg">{isPdf ? '📄' : isImg ? '🖼️' : '📎'}</span>
          <button type="button" onClick={() => onRemove(index)}
            className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
          Browse
        </button>
      )}
    </div>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────────────────
function PreviewModal({ form, photoPreview, docSlots, onClose, onSubmit, loading }) {
  const labelMap = {
    aadhaar: 'Aadhaar', studentName: 'Student Name', gender: 'Gender',
    phone: 'Contact Number', email: 'Email', parentsPhone: "Parent's Contact",
    institution: 'Institution', marks10: '10th Marks', marks12: '12th Marks',
    cutoffMark: 'Cutoff Mark', course: 'Course',
    address: 'Address', country: 'Country', state: 'State', city: 'City',
  };

  const Row = ({ k, v }) => v ? (
    <div className="flex gap-2 py-1.5 border-b border-gray-50 dark:border-white/5 last:border-0">
      <span className="text-xs text-gray-400 dark:text-gray-500 w-32 flex-shrink-0">{labelMap[k] || k}</span>
      <span className="text-xs font-medium text-gray-800 dark:text-gray-200 break-words flex-1">{v}</span>
    </div>
  ) : null;

  const filledDocs = docSlots.filter((s) => s.file);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 w-full max-w-lg my-4 animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Review Before Submitting</h3>
            <p className="text-xs text-gray-400 mt-0.5">Verify all details are correct</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-100 dark:border-indigo-800 flex-shrink-0">
              {photoPreview
                ? <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl">👤</div>
              }
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{form.studentName || '—'}</p>
              <p className="text-xs text-gray-400">{form.course || '—'}</p>
            </div>
          </div>

          {/* Personal */}
          <div>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">Personal Information</p>
            {['aadhaar','studentName','gender','phone','email','parentsPhone'].map((k) => <Row key={k} k={k} v={form[k]} />)}
          </div>

          {/* Academic */}
          <div>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">Academic Details</p>
            {['institution','marks10','marks12','cutoffMark','course'].map((k) => <Row key={k} k={k} v={form[k]} />)}
          </div>

          {/* Address */}
          <div>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">Address</p>
            {['address','country','state','city'].map((k) => <Row key={k} k={k} v={form[k]} />)}
          </div>

          {/* Documents */}
          {filledDocs.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">Documents ({filledDocs.length})</p>
              <div className="space-y-1">
                {filledDocs.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <span>{s.file.type.includes('pdf') ? '📄' : s.file.type.startsWith('image') ? '🖼️' : '📎'}</span>
                    <span className="truncate">{s.label}</span>
                    <span className="text-gray-400 flex-shrink-0">— {s.file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex gap-3">
          <button onClick={onSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
              : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>Confirm & Submit</>
            }
          </button>
          <button onClick={onClose} disabled={loading}
            className="px-5 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Document slot definitions ──────────────────────────────────────────────────
const DOC_SLOTS = [
  { label: '10th Marksheet',  required: true  },
  { label: '12th Marksheet',  required: true  },
  { label: 'Transfer Certificate (TC)',  required: false },
  { label: 'Community Certificate',      required: false },
  { label: 'Income Certificate',         required: false },
  { label: 'Conduct Certificate',        required: false },
  { label: 'Aadhar Card Copy',           required: false },
  { label: 'Passport Size Photo (extra)',required: false },
  { label: 'Other Document 1',           required: false },
  { label: 'Other Document 2',           required: false },
];

// ── Main component ─────────────────────────────────────────────────────────────
export default function SubmitReferral() {
  const [form, setForm]         = useState(INITIAL);
  const [errors, setErrors]     = useState({});
  const [alert, setAlert]       = useState(null);
  const [loading, setLoading]   = useState(false);

  // Photo state
  const [photo, setPhoto]             = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [rawPhotoSrc, setRawPhotoSrc]   = useState(null);  // original for crop
  const [showCrop, setShowCrop]         = useState(false);

  // Documents: array of { file | null } matching DOC_SLOTS
  const [docFiles, setDocFiles] = useState(Array(DOC_SLOTS.length).fill(null));

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);

  const toast = useToast();
  const { push: pushNotif } = useNotificationCenter();
  const { user } = useAuth();

  const states = useMemo(() => (form.country ? Object.keys(LOCATION_DATA[form.country] || {}).sort() : []), [form.country]);
  const cities = useMemo(() => (form.state ? (LOCATION_DATA[form.country]?.[form.state] || []).sort() : []), [form.country, form.state]);

  function set(name, value) {
    setForm((p) => {
      const next = { ...p, [name]: value };
      if (name === 'country') { next.state = ''; next.city = ''; }
      if (name === 'state')   { next.city = ''; }
      return next;
    });
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  }

  function handleChange(e) { set(e.target.name, e.target.value); }

  // Photo: open crop modal after selecting
  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrors((p) => ({ ...p, photo: 'Photo must be under 10MB.' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawPhotoSrc(ev.target.result);
      setShowCrop(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleCropDone(croppedFile, croppedUrl) {
    setPhoto(croppedFile);
    setPhotoPreview(croppedUrl);
    setShowCrop(false);
    setRawPhotoSrc(null);
    setErrors((p) => ({ ...p, photo: undefined }));
  }

  function handleCropCancel() {
    setShowCrop(false);
    setRawPhotoSrc(null);
  }

  // Documents
  function handleDocFile(index, file) {
    setDocFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  }

  function handleDocRemove(index) {
    setDocFiles((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  // Validate and open preview
  function handlePreview(e) {
    e.preventDefault();
    setAlert(null);
    const errs = validate(form, photo);
    // Check required docs
    DOC_SLOTS.forEach((slot, i) => {
      if (slot.required && !docFiles[i]) {
        errs[`doc_${i}`] = `${slot.label} is required.`;
      }
    });
    if (Object.keys(errs).length) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors({});
    setShowPreview(true);
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('aadhaar',      form.aadhaar);
      fd.append('studentName',  form.studentName);
      fd.append('gender',       form.gender);
      fd.append('phone',        form.phone);
      fd.append('email',        form.email);
      if (form.parentsPhone) fd.append('parentsPhone', form.parentsPhone);
      fd.append('institution',  form.institution);
      fd.append('marks10',      form.marks10);
      fd.append('marks12',      form.marks12);
      if (form.cutoffMark) fd.append('cutoffMark', form.cutoffMark);
      fd.append('address',      form.address);
      fd.append('country',      form.country);
      fd.append('state',        form.state);
      fd.append('city',         form.city);
      fd.append('course',       form.course);
      if (photo) fd.append('photo', photo);
      docFiles.forEach((f) => { if (f) fd.append('documents', f); });

      await client.post('/referrals', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      setAlert({ type: 'success', message: 'Referral submitted successfully! The candidate has been added to the system.' });
      toast?.addToast({ title: 'Referral Submitted', message: `${form.studentName} has been referred successfully.`, type: 'success', pushNotify: true });
      pushNotif({ target: user?.role || 'user', type: 'referral_submitted', title: 'Referral Submitted Successfully', message: `${form.studentName} has been referred for ${form.course}. You will be notified when the status changes.`, studentName: form.studentName, course: form.course, link: '/status' });
      pushNotif({ target: 'admin', type: 'new_referral', title: 'New Referral Received', message: 'A new referral has been submitted and is awaiting your review.', studentName: form.studentName, referrerName: user?.name || 'Unknown', referrerRole: user?.role || 'unknown', course: form.course, aadhaar: form.aadhaar, link: '/status' });

      setForm(INITIAL);
      setDocFiles(Array(DOC_SLOTS.length).fill(null));
      setPhoto(null);
      setPhotoPreview(null);
      setErrors({});
      setShowPreview(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setShowPreview(false);
      if (err.response?.status === 409) {
        setAlert({ type: 'error', message: 'This candidate has already been referred by someone else.' });
        toast?.addToast({ title: 'Duplicate Referral', message: 'This Aadhaar has already been referred.', type: 'error', pushNotify: true });
        pushNotif({ target: user?.role || 'user', type: 'duplicate_detected', title: 'Duplicate Referral Detected', message: `Aadhaar ${form.aadhaar} has already been referred. Only the first submission is valid.`, studentName: form.studentName || null, link: '/status' });
      } else {
        setAlert({ type: 'error', message: err.response?.data?.error || 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  }

  const docSlotData = DOC_SLOTS.map((s, i) => ({ ...s, file: docFiles[i] }));
  const requiredDocErrors = DOC_SLOTS.filter((s, i) => s.required && !docFiles[i]);

  return (
    <div className="flex min-h-screen bg-[#f0f2f9] dark:bg-[#0f1117]">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <TopBar title="Submit Referral" subtitle="Fill in all candidate details carefully" />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-3xl mx-auto">

            {/* Alert */}
            {alert && (
              <div className={`mb-6 flex items-start gap-3 p-4 rounded-2xl border text-sm animate-slide-in-right
                ${alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'}`}>
                <span className="text-lg mt-0.5">{alert.type === 'success' ? '✅' : '❌'}</span>
                <p>{alert.message}</p>
              </div>
            )}

            <form onSubmit={handlePreview} noValidate className="space-y-6">

              {/* ── Section 1: Personal Info ── */}
              <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-white/5 p-5 sm:p-6 animate-slide-up">
                <SectionHeader step="1" title="Personal Information" icon="👤" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  <Field label="Aadhaar Number" error={errors.aadhaar}>
                    <input name="aadhaar" value={form.aadhaar} onChange={handleChange}
                      placeholder="12-digit Aadhaar" inputMode="numeric" maxLength={12}
                      className={inputCls(errors.aadhaar)} />
                  </Field>

                  <Field label="Student Full Name" error={errors.studentName}>
                    <SpeechInput name="studentName" value={form.studentName} onChange={handleChange}
                      placeholder="As per official documents" className={inputCls(errors.studentName)} />
                  </Field>

                  <Field label="Gender" error={errors.gender}>
                    <div className="relative">
                      <select name="gender" value={form.gender} onChange={handleChange}
                        className={selectCls(errors.gender, false)}>
                        <option value="">— Select Gender —</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </Field>

                  <Field label="Contact Number" error={errors.phone}>
                    <input name="phone" value={form.phone} onChange={handleChange}
                      placeholder="10-digit mobile number" inputMode="numeric" maxLength={10}
                      className={inputCls(errors.phone)} />
                  </Field>

                  <Field label="Email Address" error={errors.email}>
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      placeholder="student@example.com" className={inputCls(errors.email)} />
                  </Field>

                  <Field label="Parent's Contact Number" required={false} error={errors.parentsPhone}
                    hint="10-digit mobile number of parent/guardian">
                    <input name="parentsPhone" value={form.parentsPhone} onChange={handleChange}
                      placeholder="Parent's 10-digit number" inputMode="numeric" maxLength={10}
                      className={inputCls(errors.parentsPhone)} />
                  </Field>

                </div>
              </div>

              {/* ── Section 2: Academic Info ── */}
              <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-white/5 p-5 sm:p-6 animate-slide-up">
                <SectionHeader step="2" title="Academic Details" icon="🎓" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  <div className="sm:col-span-2">
                    <Field label="School / Institution Name" error={errors.institution}>
                      <input name="institution" value={form.institution} onChange={handleChange}
                        placeholder="e.g. St. Joseph's Higher Secondary School"
                        className={inputCls(errors.institution)} />
                    </Field>
                  </div>

                  <Field label="10th Mark / Percentage / Grade" error={errors.marks10}>
                    <input name="marks10" value={form.marks10} onChange={handleChange}
                      placeholder="e.g. 92% or A+" className={inputCls(errors.marks10)} />
                  </Field>

                  <Field label="12th Mark / Percentage / Grade" error={errors.marks12}>
                    <input name="marks12" value={form.marks12} onChange={handleChange}
                      placeholder="e.g. 88% or B+" className={inputCls(errors.marks12)} />
                  </Field>

                  <Field label="Cutoff Mark" required={false} error={errors.cutoffMark}
                    hint="Enter the cutoff score if applicable">
                    <input name="cutoffMark" value={form.cutoffMark} onChange={handleChange}
                      placeholder="e.g. 185.5" inputMode="decimal"
                      className={inputCls(errors.cutoffMark)} />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Course Interested" error={errors.course}>
                      <div className="relative">
                        <select name="course" value={form.course} onChange={handleChange}
                          className={selectCls(errors.course, false)}>
                          <option value="">— Select a course —</option>
                          {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </Field>
                  </div>

                </div>
              </div>

              {/* ── Section 3: Address ── */}
              <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-white/5 p-5 sm:p-6 animate-slide-up">
                <SectionHeader step="3" title="Address & Location" icon="📍" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  <div className="sm:col-span-2">
                    <Field label="Full Address" error={errors.address}>
                      <textarea name="address" value={form.address} onChange={handleChange}
                        placeholder="Door No., Street, Area, Landmark…" rows={3}
                        className={`${inputCls(errors.address)} resize-none`} />
                    </Field>
                  </div>

                  <Field label="Country" error={errors.country}>
                    <div className="relative">
                      <select name="country" value={form.country} onChange={handleChange}
                        className={selectCls(errors.country, false)}>
                        <option value="">— Select Country —</option>
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </Field>

                  <Field label="State / Province" error={errors.state}>
                    <div className="relative">
                      <select name="state" value={form.state} onChange={handleChange}
                        disabled={!form.country} className={selectCls(errors.state, !form.country)}>
                        <option value="">{form.country ? '— Select State —' : '— Select Country first —'}</option>
                        {states.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </Field>

                  <Field label="City" error={errors.city}>
                    <div className="relative">
                      <select name="city" value={form.city} onChange={handleChange}
                        disabled={!form.state} className={selectCls(errors.city, !form.state)}>
                        <option value="">{form.state ? '— Select City —' : '— Select State first —'}</option>
                        {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </Field>

                </div>
              </div>

              {/* ── Section 4: Profile Photo ── */}
              <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-white/5 p-5 sm:p-6 animate-slide-up">
                <SectionHeader step="4" title="Student Profile Photo" icon="📸" />
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  Upload a clear passport-size photo. You can crop it after selecting. <span className="text-red-500 font-semibold">Required.</span>
                </p>

                <div className="flex flex-col sm:flex-row items-start gap-5">
                  {/* Preview */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-2">
                    <div className={`w-28 h-28 rounded-2xl border-2 overflow-hidden flex items-center justify-center transition-all
                      ${errors.photo ? 'border-red-300 dark:border-red-700' : photoPreview ? 'border-indigo-200 dark:border-indigo-700' : 'border-dashed border-gray-200 dark:border-white/10'}
                      bg-gray-50 dark:bg-white/5`}>
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                          <span className="text-3xl">👤</span>
                          <p className="text-[10px] text-gray-400 mt-1">No photo</p>
                        </div>
                      )}
                    </div>
                    {photoPreview && (
                      <div className="flex gap-2">
                        <label className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 cursor-pointer transition-colors font-medium">
                          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
                          ✏️ Recrop
                        </label>
                        <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                          className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                          🗑 Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Upload zone */}
                  {!photoPreview && (
                    <label className="flex-1 w-full flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
                      border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5
                      hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10">
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Click to upload & crop photo</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">JPG, PNG, WEBP · Max 10MB</p>
                    </label>
                  )}

                  {photoPreview && (
                    <div className="flex-1 flex items-center justify-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-700">
                      <div className="text-center">
                        <span className="text-2xl">✅</span>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mt-1">Photo uploaded & cropped</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">400×400px · Ready to submit</p>
                      </div>
                    </div>
                  )}
                </div>
                {errors.photo && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {errors.photo}
                  </p>
                )}
              </div>

              {/* ── Section 5: Documents ── */}
              <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-white/5 p-5 sm:p-6 animate-slide-up">
                <SectionHeader step="5" title="Academic Documents" icon="📄" />

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-3 h-3 rounded-sm bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700" />
                    Required (10th & 12th marksheets)
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10" />
                    Optional (up to 8 more)
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-3 h-3 rounded-sm bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700" />
                    Uploaded
                  </div>
                </div>

                <div className="space-y-2">
                  {DOC_SLOTS.map((slot, i) => (
                    <DocSlot
                      key={i}
                      index={i}
                      label={slot.label}
                      required={slot.required}
                      file={docFiles[i]}
                      onFile={handleDocFile}
                      onRemove={handleDocRemove}
                    />
                  ))}
                </div>

                {/* Required doc errors */}
                {(errors.doc_0 || errors.doc_1) && (
                  <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Missing required documents:</p>
                    {errors.doc_0 && <p className="text-xs text-red-600 dark:text-red-400">• {errors.doc_0}</p>}
                    {errors.doc_1 && <p className="text-xs text-red-600 dark:text-red-400">• {errors.doc_1}</p>}
                  </div>
                )}

                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                  {docFiles.filter(Boolean).length} / {DOC_SLOTS.length} files uploaded · PDF, JPG, PNG, DOC · max 5MB each
                </p>
              </div>

              {/* ── Preview + Submit buttons ── */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-sm font-bold
                    hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-glow
                    flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Preview & Submit
                </button>
              </div>

            </form>
          </div>
        </main>
      </div>

      {/* Crop Modal */}
      {showCrop && rawPhotoSrc && (
        <CropModal src={rawPhotoSrc} onDone={handleCropDone} onCancel={handleCropCancel} />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          form={form}
          photoPreview={photoPreview}
          docSlots={docSlotData}
          onClose={() => setShowPreview(false)}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </div>
  );
}
