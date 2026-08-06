import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { removeAuthToken } from "../../utils/auth";
import "./Home.css";
import "./Service.css";
import "./About.css";
import "./Contact.css";
import Navbar from "../Nav/Navbar";
import Footer from "../Footer/Footer";
import Cart from "../UserManager/cart";
import Payment from "../UserManager/Payment";
import UserDashboard from "../UserManager/UserDashboard";
import SubmitFeedback from "../UserManager/SubmitFeedback";
// Image imports with fallbacks
import BannerImg1 from "./Home-Images/BannerImg1.jpg";
import BannerImg2 from "./Home-Images/BannerImg2.jpg";
import BannerImg3 from "./Home-Images/BannerImg3.jpg";
import BannerImg4 from "./Home-Images/BannerImg4.jpg";
import BannerImg5 from "./Home-Images/BannerImg5.jpg";
import CusSupport from "./Home-Images/cusSupport.png";
import Quality from "./Home-Images/quality.png";
import Warranty from "./Home-Images/warranty.png";
import PowerSaving from "./Home-Images/powerSaving.png";
import Aboutus_banner from "./Home-Images/Aboutus-banner.jpg";
import kw5Solar from "./Home-Images/5kw solar.png";
import Inverter from "./Home-Images/Inverter.jpg";
import BusinessSolar from "./Home-Images/Business solar.png";
import Battery from "./Home-Images/ProductBattery.jpg";
import Gimage1 from "./Home-Images/G1.jpg";
import Gimage2 from "./Home-Images/G2.jpg";
import Gimage3 from "./Home-Images/G3.jpg";
import Gimage4 from "./Home-Images/G4.jpeg";
import Gimage5 from "./Home-Images/G5.jpeg";
import Gimage6 from "./Home-Images/G6.jpeg";
import Gimage7 from "./Home-Images/G7.jpeg";
import Gimage8 from "./Home-Images/G8.jpeg";
import CTA_image from "./Home-Images/cta-image.jpg";
function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const view = query.get("view");
  // Force re-render on query parameter change
  useEffect(() => {
    // This ensures the component re-renders when the view parameter changes
  }, [location.search]);
  // Fetch items for the Packages page
  useEffect(() => {
    if (view === "packages") {
      const fetchItems = async () => {
        setLoading(true);
        try {
          const response = await axios.get("http://localhost:5000/api/items");
          const data = Array.isArray(response.data) ? response.data : [];
          setItems(data);
          setFilteredItems(data); // Initialize filteredItems with all items
          setLoading(false);
        } catch (err) {
          if (err.response && err.response.status === 404) {
            setError("API endpoint not found. Please check the backend server.");
          } else {
            setError("Failed to fetch items. Please try again later.");
          }
          setItems([]);
          setFilteredItems([]);
          setLoading(false);
        }
      };
      fetchItems();
    }
  }, [view]);
  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredItems(items); // Reset to all items if search is empty
    } else {
      const filtered = items.filter((item) =>
        item.item_name?.toLowerCase().startsWith(query)
      );
      setFilteredItems(filtered);
    }
  };
  // Handle adding item to cart
  const handleAddToCart = async (itemId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to add items to cart.");
        navigate("/login");
        return;
      }
      const response = await axios.post(
        "http://localhost:5000/api/cart",
        { itemId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Item added to cart successfully!");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert("Session expired. Please log in again.");
        removeAuthToken();
        navigate("/login");
      } else {
        alert("Failed to add item to cart. Please try again.");
      }
    }
  };
  // Handle view query parameter
  if (view === "dashboard") {
    return <UserDashboard />;
  }
  if (view === "cart") {
    return <Cart />;
  }
  if (view === "payment") {
    return <Payment />;
  }
  if (view === "feedback") {
    return <SubmitFeedback />;
  }
 
  if (view === "packages") {
    return (
      <div className="home-container packages-page">
        <Navbar />
        <div className="packages-header">
          <h2 className="packages-title">Our Solar Products</h2>
          <p className="packages-subtitle">Discover our range of premium solar solutions for your energy needs</p>
        </div>
       
        <div className="search-container">
          <div className="search-wrapper">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => {
                  setSearchQuery("");
                  setFilteredItems(items);
                }}
              >
                ✕
              </button>
            )}
          </div>
          <div className="search-results-info">
            {searchQuery && (
              <span className="results-count">
                {filteredItems.length} {filteredItems.length === 1 ? 'product' : 'products'} found
              </span>
            )}
          </div>
        </div>
        {loading && <div className="loading-state"><div className="spinner"></div><p>Loading products...</p></div>}
        {error && <div className="error-state"><p>{error}</p></div>}
        {Array.isArray(filteredItems) && filteredItems.length > 0 ? (
          <div id="products-grid">
            {filteredItems.map((item) => (
              <div key={item._id} className="product-card">
                <img
                  src={
                    item.item_image
                      ? `http://localhost:5000/item_images/${item.item_image}`
                      : kw5Solar
                  }
                  alt={item.item_name || "Item image"}
                  className="product-image"
                  onError={(e) => {
                    e.target.src = kw5Solar; // Fallback image
                  }}
                />
                <div className="product-details">
                  <p id="serial-number">Serial: {item.serial_number || "N/A"}</p>
                  <h3 id="item-name">{item.item_name || "N/A"}</h3>
                  <p id="category">Category: {item.category || "N/A"}</p>
                  <p id="description">{item.description || "N/A"}</p>
                  <p id="quantity">Stock: {item.quantity_in_stock || 0}</p>
                  <p id="selling-price">Rs. {(item.selling_price || 0).toLocaleString()}</p>
                  <button
                    onClick={() => handleAddToCart(item._id)}
                    className="add-to-cart-btn"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && <div className="no-results-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <h3>No products found</h3>
            <p>Try adjusting your search terms or browse all products</p>
          </div>
        )}
        <Footer />
      </div>
    );
  }
  if (view === "service") {
    return (
      <div className="home-container" id="service-page">
        <Navbar />
        <div id="service-hero">
          <h1>Solara ERP System: Enterprise-Grade Solar Management</h1>
          <p>Elevate your solar energy operations with our cutting-edge ERP solution, tailored for efficiency, scalability, and compliance.</p>
        </div>
        <div id="service-content">
          <section id="erp-overview">
            <h2>Transform Your Solar Operations with Solara ERP</h2>
            <p>
              The Solara ERP System is a comprehensive enterprise resource planning platform engineered to optimize solar energy management for residential, commercial, and industrial clients across Sri Lanka. Built with advanced technology, Solara ERP integrates seamlessly with existing solar infrastructure, offering real-time insights, automated workflows, and robust analytics to drive operational excellence. Our platform ensures compliance with Ceylon Electricity Board (CEB) regulations and supports hybrid solar setups, delivering unparalleled reliability and performance.
            </p>
            <img src={BannerImg3} alt="Solara ERP System Dashboard" id="erp-image" onError={(e) => { e.target.src = kw5Solar; }} />
          </section>
          <section id="erp-features">
            <h2>Advanced Features for Solar Excellence</h2>
            <div id="features-grid">
              <div className="feature-item" id="feature-monitoring">
                <h3>Real-Time Energy Monitoring</h3>
                <p>Access live data dashboards to monitor energy production, consumption, and grid interaction, enabling data-driven decisions to maximize efficiency.</p>
              </div>
              <div className="feature-item" id="feature-analytics">
                <h3>AI-Powered Predictive Analytics</h3>
                <p>Utilize machine learning algorithms to forecast energy trends, optimize usage patterns, and predict maintenance requirements, reducing operational costs.</p>
              </div>
              <div className="feature-item" id="feature-maintenance">
                <h3>Automated Maintenance Scheduling</h3>
                <p>Streamline maintenance with automated scheduling, real-time alerts, and integrated technician coordination, minimizing downtime and ensuring system longevity.</p>
              </div>
              <div className="feature-item" id="feature-integration">
                <h3>Seamless Grid and System Integration</h3>
                <p>Integrate with CEB grid systems and third-party solar hardware, supporting hybrid setups for uninterrupted power and compliance with local regulations.</p>
              </div>
              <div className="feature-item" id="feature-security">
                <h3>Enterprise-Grade Security</h3>
                <p>Protect your data with robust encryption, secure APIs, and compliance with international cybersecurity standards, ensuring peace of mind for your operations.</p>
              </div>
              <div className="feature-item" id="feature-scalability">
                <h3>Scalable Architecture</h3>
                <p>Designed for scalability, Solara ERP supports businesses of all sizes, from small residential setups to large-scale industrial solar farms.</p>
              </div>
            </div>
          </section>
          <section id="erp-benefits">
            <h2>Why Solara ERP is the Industry Leader</h2>
            <ul>
              <li><strong>Enhanced Efficiency:</strong> Achieve up to 35% improvement in energy utilization through intelligent optimization and real-time insights.</li>
              <li><strong>Cost Savings:</strong> Reduce operational and maintenance costs with predictive analytics and automated workflows.</li>
              <li><strong>Regulatory Compliance:</strong> Ensure full compliance with CEB and international energy standards, minimizing regulatory risks.</li>
              <li><strong>Scalable Solutions:</strong> Adaptable to growing energy needs, supporting both small and large-scale solar deployments.</li>
              <li><strong>24/7 Expert Support:</strong> Access our dedicated support team and certified technicians for round-the-clock assistance.</li>
              <li><strong>Actionable Insights:</strong> Generate detailed reports on energy savings, ROI, and system performance to inform strategic decisions.</li>
            </ul>
          </section>
          <section id="erp-cta">
            <h2>Partner with Us for Solar Innovation</h2>
            <p>
              Unlock the full potential of your solar energy systems with Solara ERP. Our team of experts is ready to provide tailored solutions, from initial consultation to full implementation.
            </p>
          </section>
        </div>
        <Footer />
      </div>
    );
  }
  if (view === "about") {
    return (
      <div className="home-container" id="about-page">
        <Navbar />
        <div id="about-hero">
          <h1>About Selfme.lk</h1>
          <p>Your Trusted Partner in Sustainable Solar Energy Solutions</p>
        </div>
        <div id="about-content">
          <section id="about-overview">
            <h2>Who We Are</h2>
            <div id="about-overview-content">
              <div id="about-image-container">
                <img src={Aboutus_banner} alt="Selfme.lk Solar Solutions" onError={(e) => { e.target.src = kw5Solar; }} id="about-overview-image" />
              </div>
              <div id="about-text-container">
                <p>
                  Selfme.lk is a premier provider of solar energy solutions in Sri Lanka, dedicated to driving the transition to sustainable and renewable energy. Established in 2015, we have grown to become a trusted name in the industry, delivering cutting-edge solar panel installations, advanced energy storage systems, and enterprise-grade solar management solutions. Our mission is to empower homes, businesses, and industries with clean, cost-effective, and reliable energy.
                </p>
                <p>
                  With a team of certified engineers and energy experts, we pride ourselves on delivering high-quality installations that meet international standards. Our strategic partnerships with industry leaders, such as Kelani Cables and the Ceylon Electricity Board (CEB), ensure seamless integration and compliance with local regulations, providing our clients with peace of mind and exceptional performance.
                </p>
              </div>
            </div>
          </section>
          <section id="about-mission-vision">
            <h2>Our Mission & Vision</h2>
            <div id="mission-vision-grid">
              <div id="mission">
                <h3>Mission</h3>
                <p>
                  To deliver innovative, sustainable, and affordable solar energy solutions that reduce carbon footprints and empower communities across Sri Lanka to embrace renewable energy.
                </p>
              </div>
              <div id="vision">
                <h3>Vision</h3>
                <p>
                  To lead the renewable energy revolution in Sri Lanka, creating a future where clean, reliable, and accessible energy powers every home, business, and industry.
                </p>
              </div>
            </div>
          </section>
          <section id="about-values">
            <h2>Our Core Values</h2>
            <div id="values-grid">
              <div id="value-sustainability" className="value-item">
                <h3>Sustainability</h3>
                <p>Committed to reducing environmental impact through renewable energy solutions.</p>
              </div>
              <div id="value-quality" className="value-item">
                <h3>Quality</h3>
                <p>Using premium materials and adhering to the highest industry standards.</p>
              </div>
              <div id="value-innovation" className="value-item">
                <h3>Innovation</h3>
                <p>Leveraging cutting-edge technology to enhance energy efficiency and performance.</p>
              </div>
              <div id="value-customer" className="value-item">
                <h3>Customer-Centricity</h3>
                <p>Providing exceptional service and support to ensure customer satisfaction.</p>
              </div>
            </div>
          </section>
          <section id="about-team">
            <h2>Our Expert Team</h2>
            <p>
              Our team comprises certified solar engineers, energy consultants, and customer support specialists with over 50 years of combined experience in the renewable energy sector. We are passionate about delivering tailored solutions that meet the unique needs of our clients, backed by 24/7 support and comprehensive warranties.
            </p>
          </section>
          <section id="about-cta">
            <h2>Join Our Journey</h2>
            <p>
              Discover how Selfme.lk can transform your energy future with our innovative solar solutions.
            </p>
          </section>
        </div>
        <Footer />
      </div>
    );
  }
   if (view === "contact") {
    return (
      <div className="home-container" id="contact-page">
        <Navbar />
        <div id="contact-hero">
          <h1>Contact Selfme.lk</h1>
          <p>We're here to help you power your future with sustainable solar solutions.</p>
        </div>
        <div id="contact-content">
          <section id="contact-overview">
            <h2>Get in Touch</h2>
            <p>
              Whether you have questions about our solar products, need assistance with your installation, or want to explore our Solara ERP system, our dedicated team is ready to assist you. Reach out to us using the contact details below.
            </p>
          </section>
          <section id="contact-form-section">
            <h2>Contact Information</h2>
            <div id="contact-info">
              <p><strong>Address:</strong> No/346, Madalanda, Dompe, Colombo, Sri Lanka</p>
              <p><strong>Phone:</strong> +94 717 882 883</p>
              <p><strong>Email:</strong> Selfmepvtltd@gmail.com </p>
              <p><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM</p>
            </div>
          </section>
          <section id="contact-cta">
            <h2>Ready to Start Your Solar Journey?</h2>
            <p>
              Contact our team today to schedule a consultation or request a customized solar solution tailored to your needs.
            </p>
          </section>
        </div>
        <Footer />
      </div>
    );
  }
  const slides = [
    {
      image: BannerImg1,
      title: "Power Your Future with Solar Energy",
      subtitle: "Leading Solar Solutions in Sri Lanka",
      description:
        "Transform your home and business with sustainable solar power systems. Join thousands of satisfied customers who've made the switch to clean, renewable energy.",
      buttonText: "Get Free Quote",
      highlight: "Save up to 80% on electricity bills",
    },
    {
      image: BannerImg2,
      title: "Professional Solar Installation",
      subtitle: "Expert Team • Quality Guarantee",
      description:
        "Our certified engineers provide complete solar panel installation services with 25-year warranty. From residential rooftops to commercial complexes.",
      buttonText: "View Our Work",
      highlight: "1000+ Successful Installations",
    },
    {
      image: BannerImg3,
      title: "Smart Solar Management System",
      subtitle: "Monitor & Control Your Energy",
      description:
        "Advanced ERP system to track your solar energy production, consumption, and savings in real-time. Optimize your energy usage with intelligent analytics.",
      buttonText: "Learn More",
      highlight: "Real-time Energy Monitoring",
    },
    {
      image: BannerImg4,
      title: "Eco-Friendly Energy Solutions",
      subtitle: "For a Sustainable Tomorrow",
      description:
        "Reduce your carbon footprint while saving money. Our premium solar panels are designed to withstand Sri Lankan weather conditions for decades.",
      buttonText: "Calculate Savings",
      highlight: "25+ Years Lifespan Guarantee",
    },
    {
      image: BannerImg5,
      title: "Complete Solar Packages",
      subtitle: "Affordable • Reliable • Efficient",
      description:
        "Choose from our range of solar packages designed for homes, businesses, and industries. Flexible payment plans and government subsidies available.",
      buttonText: "View Packages",
      highlight: "Starting from Rs. 150,000",
    },
  ];
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);
  const goToSlide = (index) => {
    setCurrentSlide(index);
  };
  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };
  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };
  return (
    <div className="home-container">
      <Navbar />
      <div id="default-carousel" className="relative w-full" data-carousel="slide">
        <div className="relative h-56 overflow-hidden rounded-lg md:h-96">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`banner-slide duration-700 ease-in-out ${
                index === currentSlide ? "active" : "hidden"
              }`}
              data-carousel-item
            >
              <img
                src={slide.image}
                className="absolute block w-full h-full object-cover"
                alt={`Selfme.lk Solar - ${slide.title}`}
                onError={(e) => {
                  e.target.src = kw5Solar; // Fallback image
                }}
              />
              <div className="banner-overlay">
                <div className="banner-content">
                  <div className="content-wrapper">
                    <h1 className="banner-title">{slide.title}</h1>
                    <h2 className="banner-subtitle">{slide.subtitle}</h2>
                    <p className="banner-description">{slide.description}</p>
                    <div className="highlight-badge">
                      <span className="highlight-text">✨ {slide.highlight}</span>
                    </div>
                    <div className="banner-actions">
                      <button className="cta-button primary">{slide.buttonText}</button>
                      <button className="cta-button secondary">Contact Us</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="absolute top-0 left-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
          data-carousel-prev
          onClick={goToPrev}
        >
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 group-hover:bg-white/50">
            <svg
              className="w-4 h-4 text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 6 10"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 1 1 5l4 4"
              />
            </svg>
            <span className="sr-only">Previous</span>
          </span>
        </button>
        <button
          type="button"
          className="absolute top-0 right-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
          data-carousel-next
          onClick={goToNext}
        >
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 group-hover:bg-white/50">
            <svg
              className="w-4 h-4 text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 6 10"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 9 4-4-4-4"
              />
            </svg>
            <span className="sr-only">Next</span>
          </span>
        </button>
      </div>
      {/* Why Choose Us Section */}
      <h2 className="after-heading-choose-us">Why Choose Us</h2>
      <div className="service-box-section">
        <div className="service-box">
          <img src={Warranty} alt="Warranty Icon" onError={(e) => { e.target.src = kw5Solar; }} />
          <h2>Trust & Warranty</h2>
          <p>
            Our products come with comprehensive warranties to ensure your peace
            of mind and long-term satisfaction with your solar investment.
          </p>
        </div>
        <div className="service-box">
          <img src={Quality} alt="Quality Icon" onError={(e) => { e.target.src = kw5Solar; }} />
          <h2>High Quality Work</h2>
          <p>
            We use only premium materials and follow industry best practices to
            deliver solar solutions that stand the test of time.
          </p>
        </div>
        <div className="service-box">
          <img src={PowerSaving} alt="Power Saving Icon" onError={(e) => { e.target.src = kw5Solar; }} />
          <h2>Power Saving</h2>
          <p>
            Reduce your electricity bills by up to 80% with our energy-efficient
            solar solutions.
          </p>
        </div>
        <div className="service-box">
          <img src={CusSupport} alt="Customer Support Icon" onError={(e) => { e.target.src = kw5Solar; }} />
          <h2>24/7 Support</h2>
          <p>
            Our dedicated support team is available round the clock to address
            any questions or concerns about your solar system.
          </p>
        </div>
      </div>
      {/* About Us Section */}
      <div className="about-us">
        <h2 className="section-title">About Selfme.lk</h2>
        <div className="about-us-main">
          <div className="about-us-image">
            <img src={Aboutus_banner} alt="About Selfme.lk solar solutions" onError={(e) => { e.target.src = kw5Solar; }} />
          </div>
          <div className="about-us-content">
            <p className="about-text">
              Selfme.lk is a leading solar energy solutions provider in Sri
              Lanka, dedicated to delivering sustainable and cost-effective
              renewable energy solutions. With years of experience in the
              industry, we specialize in high-quality solar panel installations,
              energy storage systems, and comprehensive maintenance services.
              <br />
              <br />
              Our strategic collaborations with industry leaders like Kelani
              Cables guarantee superior wiring solutions that meet international
              safety standards, while our certified partnership with CEB (Ceylon
              Electricity Board) ensures seamless grid integration for all our
              installations.
            </p>
            <div className="button-group">
              <button className="primary-btn">View Products</button>
              <button className="secondary-btn">Contact us</button>
            </div>
          </div>
        </div>
      </div>
      {/* Products Section */}
      <div className="Products">
        <h2>Our Product Categories</h2>
        <div className="Product-section">
          <div className="products-category">
            <img src={kw5Solar} alt="5KW Home Solar System" onError={(e) => { e.target.src = kw5Solar; }} />
            <div>
              <h3>5KW Home Solar System</h3>
              <p>Perfect for houses, save 70% on electricity bills</p>
              <button>View Details</button>
            </div>
          </div>
          <div className="products-category">
            <img src={BusinessSolar} alt="20KW Business Package" onError={(e) => { e.target.src = kw5Solar; }} />
            <div>
              <h3>20KW Business Package</h3>
              <p>Best for small businesses and offices</p>
              <button>View Details</button>
            </div>
          </div>
          <div className="products-category">
            <img src={Battery} alt="Lithium-ion Battery Pack" onError={(e) => { e.target.src = kw5Solar; }} />
            <div>
              <h3>Lithium-ion Battery Pack</h3>
              <p>Long lifespan, maintenance-free energy storage</p>
              <button>View Details</button>
            </div>
          </div>
          <div className="products-category">
            <img src={Inverter} alt="Hybrid Inverter" onError={(e) => { e.target.src = kw5Solar; }} />
            <div>
              <h3>Hybrid Inverter</h3>
              <p>Smart switching between solar & grid power</p>
              <button>View Details</button>
            </div>
          </div>
        </div>
        <button className="allProducts-btn">View All Products</button>
      </div>
      {/* Testimonials Section */}
      <h2 className="after-heading-choose-us">Our Testimonials</h2>
      <div className="testimonial-section">
        <div className="testimonial">
          <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Customer" />
          <div className="rating">
            <span className="star">★</span>
            <span className="star">★</span>
            <span className="star">★</span>
            <span className="star">★</span>
            <span className="star">★</span>
          </div>
          <h4>Jake Gyllenhaal</h4>
          <p>"The solar installation was seamless and the energy savings are incredible!"</p>
        </div>
        <div className="testimonial">
          <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Customer" />
          <div className="rating">
            <span className="star">★</span>
            <span className="star">★</span>
            <span className="star">★</span>
            <span className="star">★</span>
            <span className="star">★</span>
          </div>
          <h4>Sarah Johnson</h4>
          <p>"Excellent service and professional team. My electricity bill dropped by 70%!"</p>
        </div>
        <div className="testimonial">
          <img src="https://randomuser.me/api/portraits/men/75.jpg" alt="Customer" />
          <div className="rating">
            <span className="star">★</span>
            <span className="star">★</span>
            <span className="star">★</span>
            <span className="star">★</span>
            <span className="star">★</span>
          </div>
          <h4>Michael Chen</h4>
          <p>"The system works perfectly even during power outages. Highly recommend!"</p>
        </div>
        <div className="testimonial">
          <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Customer" />
          <div className="rating">
            <span className="star">★</span>
            <span className="star">★</span>
            <span className="star">★</span>
            <span className="star">★</span>
            <span className="star">★</span>
          </div>
          <h4>Emily Rodriguez</h4>
          <p>"The installation was quick and the team was very knowledgeable."</p>
        </div>
      </div>
      {/* Gallery Section */}
      <div className="gallery-section">
        <h1>Our Gallery</h1>
        <div className="gallery-grid">
          <div className="gallery-item">
            <img src={Gimage1} alt="Solar installation project 1" onError={(e) => { e.target.src = kw5Solar; }} />
            <div className="image-overlay"></div>
          </div>
          <div className="gallery-item">
            <img src={Gimage2} alt="Solar installation project 2" onError={(e) => { e.target.src = kw5Solar; }} />
            <div className="image-overlay"></div>
          </div>
          <div className="gallery-item">
            <img src={Gimage3} alt="Solar installation project 3" onError={(e) => { e.target.src = kw5Solar; }} />
            <div className="image-overlay"></div>
          </div>
          <div className="gallery-item">
            <img src={Gimage4} alt="Solar installation project 4" onError={(e) => { e.target.src = kw5Solar; }} />
            <div className="image-overlay"></div>
          </div>
          <div className="gallery-item">
            <img src={Gimage5} alt="Solar installation project 5" onError={(e) => { e.target.src = kw5Solar; }} />
            <div className="image-overlay"></div>
          </div>
          <div className="gallery-item">
            <img src={Gimage6} alt="Solar installation project 6" onError={(e) => { e.target.src = kw5Solar; }} />
            <div className="image-overlay"></div>
          </div>
          <div className="gallery-item">
            <img src={Gimage7} alt="Solar installation project 7" onError={(e) => { e.target.src = kw5Solar; }} />
            <div className="image-overlay"></div>
          </div>
          <div className="gallery-item">
            <img src={Gimage8} alt="Solar installation project 8" onError={(e) => { e.target.src = kw5Solar; }} />
            <div className="image-overlay"></div>
          </div>
        </div>
      </div>
      {/* CTA Section */}
      <div className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2>Ready to Power Your Future with Solar Energy?</h2>
            <p>
              Join hundreds of satisfied customers who are saving money and
              reducing their carbon footprint with our premium solar solutions.
            </p>
            <div className="cta-buttons">
              <button className="cta-primary">Get a Free Quote</button>
              <button className="cta-secondary">Learn More</button>
            </div>
          </div>
          <div className="cta-image">
            <img src={CTA_image} alt="Solar energy solutions" onError={(e) => { e.target.src = kw5Solar; }} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
export default Home;