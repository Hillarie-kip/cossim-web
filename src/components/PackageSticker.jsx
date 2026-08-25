"use client";

import React, { forwardRef } from 'react';
import QRCode from 'qrcode';
import Barcode from 'react-barcode';

// ── Inline SVG Icon Components ────────────────────────────────────────────────
const Icon = ({ path, size = 12, color = 'currentColor', viewBox = '0 0 24 24', fill = 'none', strokeWidth = 2, children }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox={viewBox}
    fill={fill}
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0 }}
  >
    {path}
    {children}
  </svg>
);

const PackageIcon = ({ size, color = '#FFF' }) => (
  <Icon size={size} color={color} path={<>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </>} />
);

const SendIcon = ({ size, color = '#FFF' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0 }}>
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const MapPinIcon = ({ size, color = '#FFF' }) => (
  <Icon size={size} color={color} path={<>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </>} />
);

const UserIcon = ({ size, color = '#F26A26' }) => (
  <Icon size={size} color={color} path={<>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>} />
);

const BuildingIcon = ({ size, color = '#F26A26' }) => (
  <Icon size={size} color={color} viewBox="0 0 24 24" path={<>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </>} />
);

const PhoneIcon = ({ size, color = '#F26A26' }) => (
  <Icon size={size} color={color} path={
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.4a16 16 0 0 0 6.29 6.29l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  } />
);

const LocationIcon = ({ size, color = '#F26A26' }) => (
  <Icon size={size} color={color} path={<>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </>} />
);

const SearchIcon = ({ size, color = '#FFF' }) => (
  <Icon size={size} color={color} path={<>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>} />
);

const GlobeIcon = ({ size, color = '#FFF' }) => (
  <Icon size={size} color={color} path={<>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </>} />
);

const CalendarIcon = ({ size, color = '#F26A26' }) => (
  <Icon size={size} color={color} path={<>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </>} />
);

const WeightIcon = ({ size, color = '#F26A26' }) => (
  <Icon size={size} color={color} path={<>
    <line x1="12" y1="2" x2="12" y2="6" />
    <path d="M5 6h14l1 14H4L5 6z" />
    <path d="M9 10a3 3 0 0 0 6 0" />
  </>} />
);

const DollarIcon = ({ size, color = '#F26A26' }) => (
  <Icon size={size} color={color} path={<>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </>} />
);
// ── End Icons ─────────────────────────────────────────────────────────────────

// ── Per-size style tokens ─────────────────────────────────────────────────────
const SIZE_STYLES = {
  small: {
    // canvas
    width: 240, height: 420,
    // typography
    brand: '8px', thanks: '15px', arrow: '9px', subtitle: '5.5px',
    secHeader: '6.5px', label: '6px', content: '6.5px', foot: '6px',
    // spacing (numbers where used as px strings)
    pad: '4px', gap: 2,
    // component sizes
    headerIcon: 9, rowIcon: 7, searchR: 22, footIcon: 9,
    qrSize: '54px',
    // barcode
    bcWidth: 0.8, bcHeight: 36, bcFontSize: 7,
    // items truncation (characters)
    itemsMaxLen: 22,
    // section vertical margins
    rowMb: '2px', divMb: '2px',
    infoRowMb: '1px',
    detailPad: '4px',
    trackPad: '3px',
    barcodePad: '2px',
  },
  medium: {
    width: 360, height: 480,
    brand: '11px', thanks: '22px', arrow: '12px', subtitle: '7px',
    secHeader: '8px', label: '7.5px', content: '8px', foot: '8px',
    pad: '6px', gap: 3,
    headerIcon: 11, rowIcon: 8, searchR: 28, footIcon: 11,
    qrSize: '72px',
    bcWidth: 1.2, bcHeight: 48, bcFontSize: 8,
    itemsMaxLen: 32,
    rowMb: '3px', divMb: '3px',
    infoRowMb: '2px',
    detailPad: '5px',
    trackPad: '4px',
    barcodePad: '3px',
  },
  large: {
    width: 480, height: 720,
    brand: '14px', thanks: '34px', arrow: '17px', subtitle: '9px',
    secHeader: '10px', label: '9.5px', content: '10.5px', foot: '10px',
    pad: '10px', gap: 5,
    headerIcon: 15, rowIcon: 11, searchR: 40, footIcon: 14,
    qrSize: '100px',
    bcWidth: 1.6, bcHeight: 72, bcFontSize: 10,
    itemsMaxLen: 55,
    rowMb: '4px', divMb: '4px',
    infoRowMb: '2px',
    detailPad: '7px',
    trackPad: '5px',
    barcodePad: '4px',
  },
};
// ─────────────────────────────────────────────────────────────────────────────

const PackageSticker = forwardRef(({ packageData, size = 'medium', onQRGenerated }, ref) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState('');
  const [barcodeData, setBarcodeData]   = React.useState('');

  const t = SIZE_STYLES[size] || SIZE_STYLES.medium;

  const generateTrackingUrl = (orderNo) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/track?trackingNumber=${orderNo}`;
  };

  React.useEffect(() => {
    if (!packageData?.OrderNO) return;
    QRCode.toDataURL(generateTrackingUrl(packageData.OrderNO), {
      width: size === 'small' ? 70 : size === 'medium' ? 90 : 110,
      margin: 1,
      color: { dark: '#000', light: '#FFF' },
    }).then(url => {
      setQrCodeDataUrl(url);
      if (onQRGenerated) onQRGenerated(url);
    }).catch(console.error);
    setBarcodeData(packageData.OrderNO);
  }, [packageData?.OrderNO, size, onQRGenerated]);

  if (!packageData) {
    return (
      <div ref={ref} style={{ width: t.width, height: t.height, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #F26A26', borderRadius: '8px' }}>
        <span style={{ fontFamily: 'Arial', color: '#888', fontSize: '12px' }}>No package data</span>
      </div>
    );
  }

  // ── Data extraction ──
  const fromName    = packageData.SenderContactName  || packageData.SenderCompanyName || packageData.VendorName || '-';
  const fromCompany = packageData.SenderCompanyName  || packageData.VendorName || '-';
  const fromPhone   = packageData.SenderContactPhone || packageData.VendorPhone || '-';
  const fromAddr    = [packageData.SenderStreetName, packageData.SenderArea, packageData.SenderCity].filter(Boolean).join(', ') || '-';

  const toName    = packageData.ReceiverContactName  || packageData.CustomerName || '-';
  const toCompany = packageData.ReceiverCompanyName  || '-';
  const toPhone   = packageData.ReceiverContactPhone || packageData.CustomerPhone || '-';
  const toAddr    = [packageData.ReceiverStreetName, packageData.ReceiverArea, packageData.ReceiverCity].filter(Boolean).join(', ') || '-';

  const orderNo      = packageData.OrderNO || '-';
  const deliveryType = (packageData.DeliveryType || 'Standard').toUpperCase();
  const dateAdded    = packageData.DateAdded ? packageData.DateAdded.split('T')[0] : '-';
  const totalWeight  = packageData.ShipmentOrderItems?.reduce((s, i) => s + (i.weight || 0), 0) || 0;
  const weightStr    = totalWeight > 0 ? `${totalWeight.toFixed(2)} KG` : '-';

  // Items — truncate per size
  const rawItems     = (packageData.ShipmentOrderItems || []).map(i => i.productName).filter(Boolean).join(', ');
  const itemsStr     = rawItems.length > t.itemsMaxLen
    ? rawItems.slice(0, t.itemsMaxLen).trimEnd() + '…'
    : rawItems || '-';

  const notes        = packageData.Notes || '-';
  const codAmount    = packageData.CODAmount ? `KSH ${packageData.CODAmount}` : '0';

  // ── Sub-components ──────────────────────────────────────────────────────────
  const OrangeBar = ({ Icon: Ic, text }) => (
    <div style={{
      backgroundColor: '#F26A26', color: '#FFF',
      padding: `2px ${t.pad}`,
      fontSize: t.secHeader, fontWeight: '700',
      letterSpacing: '0.3px', textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
    }}>
      <Ic size={t.headerIcon} color="#FFF" />
      {text}
    </div>
  );

  const InfoRow = ({ Ic, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '3px', marginBottom: t.infoRowMb, lineHeight: 1.2 }}>
      <div style={{ paddingTop: '1px', flexShrink: 0 }}><Ic size={t.rowIcon} /></div>
      <span style={{ fontSize: t.label, fontWeight: '700', color: '#333', flexShrink: 0, whiteSpace: 'nowrap' }}>{label}: </span>
      <span style={{ fontSize: t.content, color: '#111', wordBreak: 'break-word', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
    </div>
  );

  const Dash = ({ mt = t.divMb, mb = t.divMb }) => (
    <div style={{ borderBottom: '1px dashed #CCC', marginTop: mt, marginBottom: mb }} />
  );
  // ── End Sub-components ──────────────────────────────────────────────────────

  return (
    <div
      ref={ref}
      style={{
        width: t.width,
        height: t.height,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Arial, Helvetica, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '2px solid #F26A26',
        borderRadius: '8px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── 1. HEADER ── */}
      <div style={{
        backgroundColor: '#F26A26', color: '#FFF',
        padding: `5px ${t.pad}`,
        fontSize: t.brand, fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
        flexShrink: 0,
      }}>
        <PackageIcon size={t.headerIcon} />
        COSSIM LOGISTICS
      </div>

      {/* ── 2. THANK YOU ── */}
      <div style={{
        padding: `3px ${t.pad} 2px`, textAlign: 'center',
        borderBottom: '1px solid #EDEDED', flexShrink: 0,
        backgroundColor: '#FFF9F6',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span style={{ color: '#F26A26', fontSize: t.arrow, fontWeight: '900' }}>→</span>
          <span style={{ fontSize: t.thanks, fontWeight: '900', color: '#1A1A1A', letterSpacing: '1px', lineHeight: 1.05 }}>COSSIM LIMITED</span>
          <span style={{ color: '#F26A26', fontSize: t.arrow, fontWeight: '900' }}>←</span>
        </div>
        <div style={{ fontSize: t.subtitle, color: '#999', letterSpacing: '2px', marginTop: '1px', fontWeight: '600' }}>
          — FOR CHOOSING US —
        </div>
      </div>

      {/* ── 3. FROM / TO ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #EDEDED', flexShrink: 0 }}>
        {/* FROM */}
        <div style={{ flex: 1, borderRight: '1px solid #EDEDED' }}>
          <OrangeBar Icon={SendIcon} text="FROM (SENDER)" />
          <div style={{ padding: `3px ${t.pad}`, backgroundColor: '#FFF9F6' }}>
            <InfoRow Ic={UserIcon}     label="Name"    value={fromName} />
            <InfoRow Ic={BuildingIcon} label="Company" value={fromCompany} />
            <InfoRow Ic={PhoneIcon}    label="Phone"   value={fromPhone} />
            <InfoRow Ic={LocationIcon} label="Address" value={fromAddr} />
          </div>
        </div>
        {/* TO */}
        <div style={{ flex: 1 }}>
          <OrangeBar Icon={MapPinIcon} text="TO (RECEIVER)" />
          <div style={{ padding: `3px ${t.pad}`, backgroundColor: '#FFF9F6' }}>
            <InfoRow Ic={UserIcon}     label="Name"    value={toName} />
            <InfoRow Ic={BuildingIcon} label="Company" value={toCompany} />
            <InfoRow Ic={PhoneIcon}    label="Phone"   value={toPhone} />
            <InfoRow Ic={LocationIcon} label="Address" value={toAddr} />
          </div>
        </div>
      </div>

      {/* ── 4. SHIPMENT DETAILS ── */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid #EDEDED' }}>
        <OrangeBar Icon={PackageIcon} text="SHIPMENT DETAILS" />
        <div style={{ padding: `${t.detailPad} ${t.pad}`, backgroundColor: '#FFF9F6' }}>

          {/* Order No — full width */}
          <div style={{ marginBottom: t.rowMb, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ fontSize: t.label, color: '#555', fontWeight: '700' }}>Order No:  </span>
            <span style={{ fontSize: t.content, color: '#111', fontWeight: '800' }}>{orderNo}</span>
          </div>

          <Dash mt="0" mb={t.divMb} />

          {/* Items — full width, truncated */}
          <div style={{ marginBottom: t.rowMb, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: t.label, color: '#555', fontWeight: '700' }}>Items:  </span>
            <span style={{ fontSize: t.content, color: '#111' }}>{itemsStr}</span>
          </div>

          <Dash mt="0" mb={t.divMb} />

          {/* Date + Weight (left) | Type badge (right, vertically centred) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: t.gap + 'px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CalendarIcon size={t.rowIcon} />
                <span style={{ fontSize: t.label, color: '#555', fontWeight: '700' }}>Date:</span>
                <span style={{ fontSize: t.content, color: '#111' }}>{dateAdded}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <WeightIcon size={t.rowIcon} />
                <span style={{ fontSize: t.label, color: '#555', fontWeight: '700' }}>Weight:</span>
                <span style={{ fontSize: t.content, color: '#111' }}>{weightStr}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarIcon size={t.rowIcon} />
                <span style={{ fontSize: t.label, color: '#555', fontWeight: '700' }}>Cash On Delivery:</span>
                <span style={{ fontSize: t.content, color: '#111' }}>{codAmount}</span>
              </div>
            </div>
            {/* Right: Type badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: t.label, color: '#555', fontWeight: '700' }}>Type:</span>
              <span style={{
                backgroundColor: '#F26A26', color: '#fff',
                borderRadius: '4px', padding: '2px 8px',
                fontSize: t.label, fontWeight: '900', fontStyle: 'italic',
                letterSpacing: '0.5px', whiteSpace: 'nowrap',
              }}>{deliveryType}</span>
            </div>
          </div>

          <Dash mt={t.divMb} mb="0" />
        </div>
      </div>

      {/* ── 5. NOTES ── */}
      <div style={{ flex: 1, borderBottom: '1px solid #EDEDED', backgroundColor: '#FFF9F6' }}>
        <div style={{ padding: `4px ${t.pad}` }}>
          <span style={{ fontSize: t.label, color: '#555', fontWeight: '700' }}>Notes: </span>
          <span style={{ fontSize: t.content, color: '#111', wordBreak: 'break-word' }}>{notes}</span>
        </div>
      </div>

      {/* ── bottom zone: content anchored to bottom ── */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>

        {/* ── 5. TRACK YOUR ORDER ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: `${t.trackPad} ${t.pad}`,
          borderTop: '1px solid #EDEDED',
          borderBottom: '1px solid #EDEDED',
          gap: t.gap + 'px',
          backgroundColor: '#FFF9F6',
        }}>
          {/* Circle */}
          <div style={{
            width: t.searchR, height: t.searchR, borderRadius: '50%',
            backgroundColor: '#F26A26',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <SearchIcon size={Math.round(t.searchR * 0.5)} />
          </div>
          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: t.secHeader, fontWeight: '800', color: '#F26A26', textTransform: 'uppercase', marginBottom: '1px' }}>
              TRACK YOUR ORDER
            </div>
            <div style={{ fontSize: t.label, color: '#666', lineHeight: 1.3 }}>
              Scan QR code or visit our website to track your package.
            </div>
          </div>
          {/* QR Code */}
          {qrCodeDataUrl && (
            <div style={{ border: '2px solid #F26A26', borderRadius: '4px', padding: '2px', flexShrink: 0 }}>
              <img src={qrCodeDataUrl} alt="QR" style={{ width: t.qrSize, height: t.qrSize, display: 'block' }} />
            </div>
          )}
        </div>

        {/* ── 6. BARCODE ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: `${t.barcodePad} ${t.pad}`, /* added horizontal padding */
          margin: `0 ${t.pad}`,
          borderBottom: '1px solid #EDEDED',
        }}>
          {barcodeData && (
            <Barcode
              value={barcodeData}
              width={t.bcWidth}
              height={t.bcHeight}
              fontSize={t.bcFontSize}
              margin={0}
              displayValue
              text={`WAYBILL ${barcodeData}`}
              background="#FFFFFF"
              lineColor="#000000"
              textAlign="center"
              textPosition="bottom"
              textMargin={2}
              font="Arial, sans-serif"
              fontOptions="bold"
            />
          )}
        </div>
      </div>

      {/* ── 7. FOOTER ── */}
      <div style={{
        backgroundColor: '#F26A26', color: '#FFF',
        padding: `3px ${t.pad}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
        flexShrink: 0,
      }}>
        <GlobeIcon size={t.footIcon} />
        <span style={{ fontSize: t.foot }}>WAYBILL </span>
        <span style={{ fontSize: t.foot, fontWeight: '800' }}>{orderNo}</span>
      </div>
    </div>
  );
});

PackageSticker.displayName = 'PackageSticker';
export default PackageSticker;
