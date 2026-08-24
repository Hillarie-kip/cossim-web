"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CheckCircle2, Clock3, PackageCheck, RotateCcw, Search, Ship, Truck, X } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import useShipment from "@/hooks/useShipment";
import Link from "@/components/Link";
import { readAnalyticsArray, readAnalyticsValue } from "@/utils/analyticsReportUtils";
import { useGlobalFilters } from "@/contexts/GlobalFiltersContext";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./dashboard.module.scss";
import PackagesList from "@/app/admin/(operations)/packages/page";

const fallbackStatuses = [["Delivered",120,59.4],["In Transit",34,16.8],["Processing",28,13.9],["Returned",20,9.9]].map(([StatusName,OrderCount,PercentageOfOrders])=>({StatusName,OrderCount,PercentageOfOrders}));
const fallbackAging = [["0–1 day",84],["2–3 days",61],["4–7 days",39],["8–14 days",13],["15+ days",5]].map(([AgingBucket,OrderCount])=>({AgingBucket,OrderCount}));
const orderStatusStages = [
  { StatusName: "Order Confirmed", PhaseCode: "VENDOR", aliases: ["ORDER CONFIRMED", "CONFIRMED BY VENDOR", "VENDOR CREATED"] },
  { StatusName: "HQ Hub", PhaseCode: "HQ HUB", aliases: ["HQ HUB", "PICKED BY COURIER", "ORDER PICKED BY COURIER", "HANDED TO DC CARRIER"] },
  { StatusName: "Received at DC", PhaseCode: "DC", aliases: ["RECEIVED AT DC", "ARRIVED AT DC", "RECEIVED INTO DC"] },
  { StatusName: "1st Attempt", PhaseCode: "DELIVERY", aliases: ["1ST ATTEMPT", "FIRST ATTEMPT", "DELIVERY ATTEMPTED"] },
  { StatusName: "2nd Attempt", PhaseCode: "DELIVERY", aliases: ["2ND ATTEMPT", "SECOND ATTEMPT"] },
  { StatusName: "3rd Attempt", PhaseCode: "DELIVERY", aliases: ["3RD ATTEMPT", "THIRD ATTEMPT"] },
  { StatusName: "Return Leg", PhaseCode: "RETURN", aliases: ["RETURN LEG", "RETURN IN TRANSIT", "RETURNED TO VENDOR", "RETURN REQUESTED"] },
  { StatusName: "Completed", PhaseCode: "CLOSED", aliases: ["COMPLETED", "DELIVERED", "CLOSED SUCCESS", "ACCEPTED", "PICKED UP BY CUSTOMER"] },
];
const number = value => Number(value||0).toLocaleString("en-KE");
const normalizeStatus = value => String(value||"").replaceAll("_"," ").replace(/[()]/g," ").replace(/\s+/g," ").trim().toUpperCase();
const shipmentStatusCopy = {
  ORDER_CONFIRMED:["Order confirmed","The vendor has confirmed the order and it is awaiting courier collection.","Next: Courier picks up the shipment."],
  PICKED_BY_COURIER:["Shipment collected","The courier has collected the order from the vendor.","Next: Shipment will be received at the distribution centre."],
  RECEIVED_AT_DC:["Received at distribution centre","The shipment has been received at the distribution centre.","Next: Shipment will be processed for onward transport."],
  IN_TRANSIT_TO_DC:["Shipment in transit","The shipment is moving between distribution centres.","Next: Shipment will be assigned for delivery."],
  ASSIGNED_TO_RIDER:["Assigned to rider","A rider has been assigned and is preparing for delivery.","Next: Rider departs for delivery."],
  OUT_FOR_DELIVERY:["Out for delivery","The rider is currently delivering the shipment.","Please keep your phone available for the rider."],
  DELIVERED:["Delivered successfully","The shipment has been delivered to the customer.","No further action is required."],
};
const formatBucket = value => String(value||"UNKNOWN").replaceAll("_"," ").replaceAll("–"," TO ").replaceAll("-"," TO ").replace(/\s+/g," ").trim().toUpperCase();

function Metric({label,value,helper,Icon}) { return <article className={styles.metric}><span><Icon size={19}/></span><div><small>{label}</small><strong>{value}</strong>{helper&&<em>{helper}</em>}</div></article>; }

export default function DashboardPage(){
  const router=useRouter();
  const {shipmentOrderAnalytics,orderLoading,orderError,fetchShipmentOrderAnalytics,clearShipmentOrderAnalytics}=useAnalytics();
  const {fetchShipmentOrder}=useShipment();
  const {filters}=useGlobalFilters();
  const {user}=useAuth();
  const assignedDCs=useMemo(()=>Array.isArray(user?.AssignedDistributionCenter)?user.AssignedDistributionCenter:[],[user]);
  const assignedDCCodes=assignedDCs.map(dc=>dc.DCCode||dc.dcCode).filter(Boolean);
  const activeDCCodes=String(filters.dcCodes||filters.dcCode||"").split(",").filter(code=>assignedDCCodes.includes(code)).join(",");
  const activeDCCode=activeDCCodes.split(",")[0]||"";
  const [query,setQuery]=useState("");
  const [searchResult,setSearchResult]=useState(null);
  const [searchLoading,setSearchLoading]=useState(false);
  const [searchError,setSearchError]=useState("");
  const [selectedStatus,setSelectedStatus]=useState(null);
  useEffect(()=>{clearShipmentOrderAnalytics();if(!activeDCCodes)return;fetchShipmentOrderAnalytics({startDate:`${filters.startDate}T00:00:00`,endDate:`${filters.endDate}T23:59:59`,vendorCode:filters.vendorCode||undefined,originDCCode:activeDCCodes,destinationDCCode:activeDCCodes}).catch(()=>{});},[fetchShipmentOrderAnalytics,filters.startDate,filters.endDate,filters.vendorCode,activeDCCodes]);
  const scopedAnalytics=activeDCCodes?shipmentOrderAnalytics:null;
  const summary=readAnalyticsValue(scopedAnalytics,"Summary",{});
  const statuses=readAnalyticsArray(scopedAnalytics,"StatusAnalytics");
  const risks=readAnalyticsArray(scopedAnalytics,"CurrentSLARisk");
  const statusRows=scopedAnalytics?statuses:[];
  const total=Number(readAnalyticsValue(summary,"TotalOrders",statusRows.reduce((sum,row)=>sum+Number(readAnalyticsValue(row,"OrderCount",0)),0)));
  const orderedStatusRows=useMemo(()=>orderStatusStages.map(stage=>{
    const count=statusRows.reduce((sum,row)=>{
      const name=normalizeStatus(readAnalyticsValue(row,"StatusName",""));
      return stage.aliases.some(alias=>name.includes(alias))?sum+Number(readAnalyticsValue(row,"OrderCount",0)):sum;
    },0);
    return {...stage,OrderCount:count,PercentageOfOrders:total?count/total*100:0};
  }),[statusRows,total]);
  const tasks=useMemo(()=>{
    const groups={dispatch:[],receive:[],return:[]};
    risks.forEach(row=>{const name=String(readAnalyticsValue(row,"StatusName","")).toLowerCase();if(name.includes("return")||name.includes("failed"))groups.return.push(row);else if(name.includes("transit")||name.includes("receive")||name.includes("arriv"))groups.receive.push(row);else groups.dispatch.push(row)});
    return groups;
  },[risks]);
  const orderSummaryCards=[
    ["Received from vendor",number(readAnalyticsValue(summary,"TotalOrders",0)),"Selected period",Box],
    ["In transit",number(readAnalyticsValue(summary,"ActiveOrders",0)),"Currently in progress",Clock3],
    ["Delivered",number(readAnalyticsValue(summary,"DeliveredOrders",0)),`${Number(readAnalyticsValue(summary,"DeliveryRatePercentage",0)).toFixed(1)}% delivery rate`,CheckCircle2],
    ["Failed / returned",number(readAnalyticsValue(summary,"FailedOrders",0)),`${Number(readAnalyticsValue(summary,"FailureRatePercentage",0)).toFixed(1)}% failure rate`,RotateCcw],
  ];
  const financialSummaryCards=[
    ["Shipment fees",`KES ${number(readAnalyticsValue(summary,"TotalShipmentFees",0))}`,"Gross fees",PackageCheck],
    ["COD exposure",`KES ${number(readAnalyticsValue(summary,"CashOnDeliveryAmount",0))}`,`${number(readAnalyticsValue(summary,"CashOnDeliveryOrders",0))} COD orders`,Box],
    ["Average order value",`KES ${number(total?Number(readAnalyticsValue(summary,"TotalShipmentFees",0))/total:0)}`,"Per shipment",Ship],
    ["SLA compliance",`${Number(readAnalyticsValue(readAnalyticsValue(scopedAnalytics,"SLASummary",{}),"SLACompliancePercentage",0)).toFixed(1)}%`,"Measured events",CheckCircle2],
  ];
  const taskGroups=[
    ["Orders to dispatch","dispatch",Truck,"Ready for rider assignment"],
    ["Orders to receive","receive",PackageCheck,"Arriving at distribution center"],
    ["Orders to return","return",RotateCcw,"Requires return action"],
  ];
  const handleShipmentSearch=async event=>{
    event.preventDefault();
    if(!activeDCCode){setSearchError("No distribution center is assigned to this user.");return;}
    const orderNO=query.trim();
    if(!orderNO)return;
    setSearchLoading(true);setSearchError("");setSearchResult(null);
    try{
      const response=await fetchShipmentOrder({orderNO});
      const result=response?.Data||response?.data||response;
      const record=Array.isArray(result)?result[0]:result;
      if(!record||typeof record!=="object")throw new Error("Shipment not found");
      setSearchResult(record);
    }catch(error){setSearchError(error?.message||"Shipment not found");}
    finally{setSearchLoading(false);}
  };
  const searchedOrderNO=searchResult?.OrderNO||query.trim();
  const searchedStatusCode=normalizeStatus(searchResult?.StatusCode||searchResult?.StatusName).replaceAll(" ","_");
  const searchedStatus=shipmentStatusCopy[searchedStatusCode]||[searchResult?.StatusName||"Shipment found","View the complete tracking history and latest shipment information.","Open tracking for more details."];
  const searchedUpdatedAt=searchResult?.LatestStatusDate||searchResult?.DateModified||searchResult?.DateAdded;
  return <main className={styles.page}><div className={styles.dashboard}>
    <div className={styles.operationalGrid}>
      <section className={styles.workspace}>
        <section className={styles.summaryPanel}><div className={styles.panelHeader}><div><small>PERFORMANCE SNAPSHOT</small><h2>Order summary</h2></div></div><div className={styles.metricGrid}>{orderSummaryCards.map(([label,value,helper,Icon])=><Metric key={label} label={label} value={value} helper={helper} Icon={Icon}/>)}</div></section>
        <section className={`${styles.summaryPanel} ${styles.financialPanel}`}><div className={styles.panelHeader}><div><small>FINANCIAL PERFORMANCE</small><h2>Financial summary</h2></div></div><div className={styles.metricGrid}>{financialSummaryCards.map(([label,value,helper,Icon])=><Metric key={label} label={label} value={value} helper={helper} Icon={Icon}/>)}</div></section>
      </section>
      <aside className={styles.actionPanel}><div className={styles.panelHeader}><div><small>OPERATIONS DESK</small><h1>Shipment actions</h1></div>{orderLoading&&<span className={styles.loading}>Updating…</span>}</div><div className={styles.actionContent}><div className={styles.searchTab}><div className={styles.actionSectionTitle}><Search size={15}/><strong>Search shipment</strong></div><label>Shipment number</label><form className={styles.shipmentSearchForm} onSubmit={handleShipmentSearch}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. PCK-ZJC3KF0A-8HNH4NH"/><button className={styles.searchButton} type="submit" disabled={searchLoading}>{searchLoading?"Searching…":"Search"}</button></form>{searchResult?<div className={styles.shipmentSearchResult}><div className={styles.resultIcon}><CheckCircle2 size={21}/></div><div className={styles.resultContent}><small>Current shipment status</small><h3>{searchedStatus[0]}</h3><p>{searchedStatus[1]}</p><strong>{searchedStatus[2]}</strong></div><div className={styles.resultMeta}>{searchedUpdatedAt&&<span>Last updated<br/><b>{new Date(searchedUpdatedAt).toLocaleString("en-GB")}</b></span>}<Link to={`/admin/packages/${encodeURIComponent(searchedOrderNO)}/track?trackingNumber=${encodeURIComponent(searchedOrderNO)}&from=dashboard`}>View more</Link></div></div>:<div className={styles.searchHint}>{searchError?<><Search size={30}/><h3>Shipment not found</h3><p>{searchError}</p></>:<><Search size={30}/><h3>Find a shipment</h3><p>Enter a shipment number to see its current status.</p></>}</div>}</div><div><div className={styles.actionSectionTitle}><PackageCheck size={15}/><strong>Current tasks</strong></div><div className={styles.taskList}>{taskGroups.map(([label,key,Icon,helper])=><button key={key} onClick={()=>router.push(`/admin/packages?task=${key}&from=dashboard`)}><span><Icon size={20}/></span><div><strong>{label}</strong><small>{helper}</small></div><b>{tasks[key].length}</b></button>)}{orderError&&<p className={styles.error}>{orderError}</p>}</div></div></div>
      </aside>
      <section className={styles.statusPanel}><div className={styles.sectionHeading}><div><small>LIVE OVERVIEW</small><h2>ORDER STATUS</h2></div><span>{number(total)} ORDERS</span></div><div className={styles.statusGrid}>{orderedStatusRows.map((row,index)=>{const count=Number(row.OrderCount);const percent=Number(row.PercentageOfOrders);return <button type="button" className={styles.statusItem} onClick={()=>setSelectedStatus(row.StatusName)} key={row.StatusName}><span className={styles.stepNumber}>{index+1}</span><div><span><strong>{row.StatusName.toUpperCase()}</strong><small>{row.PhaseCode}</small></span><b>{number(count)}</b></div><div className={styles.statusProgress}><i style={{width:`${Math.min(percent,100)}%`}}/></div><small>{percent.toFixed(1)}% ACHIEVED</small></button>})}</div></section>
    </div>
    <div className={`${styles.modalBackdrop} ${!selectedStatus?styles.hidden:""}`} onMouseDown={event=>{if(event.target===event.currentTarget)setSelectedStatus(null)}} aria-hidden={!selectedStatus}><section className={`${styles.modal} ${styles.packagesModal}`} role="dialog" aria-modal={Boolean(selectedStatus)}><header><div><small>ORDER STATUS</small><h2>{selectedStatus} packages</h2></div><button onClick={()=>setSelectedStatus(null)} aria-label="Close packages dialog"><X/></button></header><div className={styles.packagesModalBody}>{selectedStatus&&<PackagesList key={selectedStatus} initialStatusName={selectedStatus}/>}</div></section></div>
  </div></main>;
}
