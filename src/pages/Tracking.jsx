import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api";


export default function Tracking({ dark, setDark, logout }) {


  const [menuOpen, setMenuOpen] = useState(false);

  const [shipments, setShipments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");


  const token = localStorage.getItem("token");





  // ================= FETCH =================


  const fetchShipments = async () => {


    try {


      const res = await API.get("/shipments", {

        headers: {

          Authorization: `Bearer ${token}`

        },

      });


      console.log("SHIPMENTS:", res.data);


      setShipments(res.data || []);



    } catch (err) {


      console.log(
        "TRACKING ERROR:",
        err.response?.data || err.message
      );


      setShipments([]);



    } finally {


      setLoading(false);


    }


  };





  useEffect(() => {


    fetchShipments();


  }, []);








  // ================= FILTER =================


  const filtered = shipments.filter((s)=>{


    const text = search.toLowerCase();


    return (

      (s.productId?.name || "")
        .toLowerCase()
        .includes(text)


      ||

      (s.trackingNumber || "")
        .toLowerCase()
        .includes(text)


      ||

      (s.location || "")
        .toLowerCase()
        .includes(text)


      ||

      (s.status || "")
        .toLowerCase()
        .includes(text)

    );


  });








  // ================= STATUS ICON =================


  const getStatusIcon = (status)=>{


    switch(status){


      case "Delivered":

        return (
          <i
            className="fas fa-check-circle"
          />
        );


      case "In Transit":

        return (
          <i
            className="fas fa-truck"
          />
        );


      case "Cancelled":

        return (
          <i
            className="fas fa-times-circle"
          />
        );


      default:

        return (
          <i
            className="fas fa-clock"
          />
        );


    }


  };








  // ================= STATUS COLOR =================


  const getStatusColor=(status)=>{


    if(status==="Delivered")
      return "#22c55e";


    if(status==="In Transit")
      return "#f59e0b";


    if(status==="Cancelled")
      return "#ef4444";


    return "#2563eb";


  };







  // ================= PROGRESS =================


  const getProgress=(status)=>{


    if(status==="Delivered")
      return 100;


    if(status==="In Transit")
      return 65;


    if(status==="Pending")
      return 25;


    return 0;


  };







  // ================= STATS =================


  const total =
  shipments.length;


  const inTransit =
  shipments.filter(
    s=>s.status==="In Transit"
  ).length;



  const delivered =
  shipments.filter(
    s=>s.status==="Delivered"
  ).length;








  if(loading){


    return (

      <div className="loader-screen">

        <div className="loader-bars">

          <span></span>
          <span></span>
          <span></span>

        </div>


        <h1>
          TRACKING
        </h1>


      </div>

    );


  }







  return (

    <div
      className={`app-container ${
        dark ? "dark":"light"
      }`}
    >




      {/* HAMBURGER */}

      <button

        className={`hamburger ${
          menuOpen ? "open":""
        }`}

        onClick={()=>
          setMenuOpen(!menuOpen)
        }

      >

        <span></span>
        <span></span>
        <span></span>

      </button>







      {/* SIDEBAR */}


      <Sidebar

        menuOpen={menuOpen}

        dark={dark}

        setDark={setDark}

        logout={logout}

        active="tracking"

      />








      <main className="main-content">





        <div className="topbar">


          <h1>

            <i className="fas fa-map-marker-alt"></i>

            {" "}

            Live Tracking


          </h1>




          <input

            className="search-input"

            placeholder="Search shipment..."

            value={search}

            onChange={(e)=>
              setSearch(e.target.value)
            }

          />


        </div>








        {/* STATS */}


        <div className="stats-grid">


          <div className="stat-card">

            <i className="fas fa-box"></i>

            <h2>
              {total}
            </h2>

            <p>
              Total Shipments
            </p>


          </div>





          <div className="stat-card">


            <i className="fas fa-truck"></i>


            <h2>
              {inTransit}
            </h2>


            <p>
              In Transit
            </p>


          </div>






          <div className="stat-card">


            <i className="fas fa-check-circle"></i>


            <h2>
              {delivered}
            </h2>


            <p>
              Delivered
            </p>


          </div>



        </div>








        {/* TRACKING LIST */}


        <div className="table-card">


          <h3>

            <i className="fas fa-route"></i>

            {" "}

            Shipment Tracking


          </h3>







          {
          filtered.length===0 ?


          (

            <p>
              No shipments found
            </p>

          )



          :



          filtered.map((s)=>(



            <div

              key={s._id}

              style={{

                padding:"18px",

                borderRadius:"16px",

                background: dark
                ?
                "rgba(255,255,255,0.04)"
                :
                "#fff",

                border:
                "1px solid rgba(255,255,255,0.08)",

                boxShadow:
                "0 8px 24px rgba(0,0,0,0.08)",

                marginBottom:"18px"

              }}

            >







              {/* HEADER */}


              <div

                style={{

                  display:"flex",

                  justifyContent:"space-between",

                  marginBottom:"12px"

                }}

              >


                <h4>


                  <i className="fas fa-barcode"></i>


                  {" "}


                  {

                    s.trackingNumber ||
                    s._id

                  }


                </h4>





                <span

                  style={{

                    color:
                    getStatusColor(
                      s.status
                    ),

                    fontWeight:"700",

                    display:"flex",

                    alignItems:"center",

                    gap:"8px"

                  }}

                >


                  {
                    getStatusIcon(
                      s.status
                    )
                  }


                  {s.status}


                </span>


              </div>









              {/* PRODUCT */}


              <p>

                <i className="fas fa-box"></i>

                {" "}

                <b>
                  Product:
                </b>

                {" "}

                {
                  s.productId?.name ||
                  "Unknown Product"
                }


              </p>









              {/* USER */}


              <p>

                <i className="fas fa-user"></i>

                {" "}

                <b>
                  Customer:
                </b>

                {" "}

                {
                  s.userId?.name ||
                  s.user?.name ||
                  "Unknown User"
                }


              </p>








              {/* LOCATION */}


              <p>

                <i className="fas fa-location-dot"></i>

                {" "}

                {
                  s.location ||
                  "No Location"
                }


              </p>









              {/* PROGRESS BAR */}


              <div

                style={{

                  height:"14px",

                  background:"#1e293b",

                  borderRadius:"30px",

                  overflow:"hidden",

                  marginTop:"15px"

                }}

              >


                <div

                  style={{

                    width:
                    `${getProgress(
                      s.status
                    )}%`,

                    height:"100%",

                    background:
                    getStatusColor(
                      s.status
                    ),

                    borderRadius:"30px",

                    transition:
                    "width 1.5s ease"

                  }}

                />


              </div>








              {/* STEPS */}


              <div

                style={{

                  display:"flex",

                  justifyContent:"space-between",

                  marginTop:"10px",

                  fontSize:"12px"

                }}

              >

                <span>
                  Ordered
                </span>


                <span>
                  Packed
                </span>


                <span>
                  Transit
                </span>


                <span>
                  Delivered
                </span>


              </div>







              <small>


                Progress:


                {" "}


                {
                  getProgress(
                    s.status
                  )
                }%


              </small>





            </div>



          ))

          }





        </div>




      </main>



    </div>


  );


}