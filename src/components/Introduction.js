import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Users, 
  Heart, 
  Shield, 
  Smartphone, 
  Globe,
  ArrowRight
} from 'lucide-react';
import logo from '../assets/logo.png';

const Introduction = ({ onShowLogin }) => {
  const [, setActiveFeature] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);

     const features = [
     {
       icon: MessageCircle,
       title: "Real-time Chat",
       description: "Instant messaging with typing indicators and read receipts",
       color: "from-blue-500 to-purple-600"
     },
     {
       icon: Users,
       title: "Social Network",
       description: "Share posts, follow friends, and engage with content",
       color: "from-green-500 to-teal-600"
     },
     {
       icon: Heart,
       title: "Interactive Posts",
       description: "Like, comment, and react to posts with emojis",
       color: "from-pink-500 to-rose-600"
     },
     {
       icon: Shield,
       title: "Privacy First",
       description: "Secure messaging with end-to-end privacy controls",
       color: "from-indigo-500 to-blue-600"
     },
     {
       icon: Smartphone,
       title: "Mobile Ready",
       description: "Native mobile app for iOS and Android",
       color: "from-orange-500 to-red-600"
     },
     {
       icon: Globe,
       title: "Open Expression",
       description: "Share your thoughts without restrictions or censorship",
       color: "from-emerald-500 to-green-600"
     }
   ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Minimal background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="CHATLI" className="w-8 h-8 md:w-10 md:h-10" />
              <span className="text-xl md:text-2xl font-bold text-white">CHATLI</span>
            </div>
                         <motion.button
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={onShowLogin}
               className="px-4 md:px-6 py-2 bg-white text-black rounded-none font-light hover:bg-gray-100 transition-all duration-300 flex items-center space-x-2 text-sm md:text-base border border-white"
             >
               <span>Login</span>
               <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
             </motion.button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
                         <motion.h1 
               className="text-4xl md:text-6xl lg:text-7xl font-light text-white mb-6 tracking-wide"
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.2 }}
             >
               CHATLI
               <span className="block text-white">
                 Social Platform
               </span>
             </motion.h1>
            
                         <motion.p 
               className="text-lg md:text-xl lg:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto px-4 font-light"
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.4 }}
             >
               Chat, share posts, and connect with friends. 
               Everything in one place.
             </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
                             <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={onShowLogin}
                 className="px-8 py-3 bg-white text-black rounded-none font-light text-lg hover:bg-gray-100 transition-all duration-300 flex items-center space-x-2 border border-white"
               >
                 <span>Get Started</span>
                 <ArrowRight className="w-4 h-4" />
               </motion.button>
              
              
            </motion.div>
          </motion.div>
        </section>

                 {/* Features Section */}
         <section className="container mx-auto px-4 py-20">
           <motion.div
             initial={{ opacity: 0, y: 50 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.8 }}
             className="text-center mb-16"
           >
             <h2 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-wide">
               Key Features
             </h2>
             <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
               Built for modern communication
             </p>
           </motion.div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {features.map((feature, index) => (
               <motion.div
                 key={index}
                 initial={{ opacity: 0, y: 50 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, delay: 1 + index * 0.1 }}
                 whileHover={{ scale: 1.02 }}
                 className="bg-white/5 backdrop-blur-sm rounded-none p-8 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                 onMouseEnter={() => setActiveFeature(index)}
               >
                 <div className="w-12 h-12 border border-white/30 flex items-center justify-center mb-6">
                   <feature.icon className="w-6 h-6 text-white" />
                 </div>
                 <h3 className="text-xl font-light text-white mb-4 tracking-wide">{feature.title}</h3>
                 <p className="text-gray-400 leading-relaxed font-light">{feature.description}</p>
               </motion.div>
             ))}
           </div>
         </section>

         {/* Mobile App Section */}
         <section className="container mx-auto px-4 py-20">
           <motion.div
             initial={{ opacity: 0, y: 50 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 1.6 }}
             className="text-center mb-16"
           >
             <h2 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-wide">
               Mobile App
             </h2>
             <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
               Coming soon to iOS and Android
             </p>
           </motion.div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
             <motion.div
               initial={{ opacity: 0, x: -50 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.8, delay: 1.8 }}
               className="text-center md:text-left"
             >
               <h3 className="text-2xl font-light text-white mb-6 tracking-wide">
                 App Store Features
               </h3>
                               <div className="space-y-4 text-gray-400 font-light">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Secret posts with password protection</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Private events with exclusive chat rooms</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Real-time event chat with participants</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Push notifications for events and messages</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Camera integration for photo sharing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Dark mode and biometric authentication</span>
                  </div>
                </div>
             </motion.div>

                           <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 2.0 }}
                className="text-center"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-none p-12 border border-white/10 max-w-sm mx-auto">
                  <div className="w-24 h-24 border border-white/30 flex items-center justify-center mb-6 mx-auto">
                    <Smartphone className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-xl font-light text-white mb-4 tracking-wide">Mobile App Beta</h3>
                  <p className="text-gray-400 font-light mb-6">
                    Coming soon to iOS App Store
                  </p>
                  <div className="bg-white/10 backdrop-blur-sm rounded-none p-3 border border-white/20 mb-6">
                    <span className="text-white font-light">iOS App Store</span>
                  </div>
                  
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-light text-white mb-2">Beta Test</h4>
                    <p className="text-gray-400 font-light text-sm">
                      Only 50 users for testing
                    </p>
                  </div>
                  
                                     <motion.button
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => setShowContactModal(true)}
                     className="w-full px-6 py-3 bg-white text-black rounded-none font-light hover:bg-gray-100 transition-all duration-300 border border-white"
                   >
                     <span>Join Beta Test</span>
                   </motion.button>
                </div>
              </motion.div>
           </div>
                   </section>

          {/* Web Version Section */}
          <section className="container mx-auto px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 2.2 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-wide">
                Web Version
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
                Available now - Start using CHATLI today
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 2.4 }}
                className="text-center md:text-left"
              >
                <h3 className="text-2xl font-light text-white mb-6 tracking-wide">
                  Web Features
                </h3>
                <div className="space-y-4 text-gray-400 font-light">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Full-featured web application</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Real-time messaging and notifications</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Post creation and social networking</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Event creation and management</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Responsive design for all devices</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Dark mode and modern UI</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 2.6 }}
                className="text-center"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-none p-12 border border-white/10 max-w-sm mx-auto">
                  <div className="w-24 h-24 border border-white/30 flex items-center justify-center mb-6 mx-auto">
                    <Globe className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-xl font-light text-white mb-4 tracking-wide">Available Now</h3>
                  <p className="text-gray-400 font-light mb-6">
                    Full web application ready to use
                  </p>
                  <div className="bg-white/10 backdrop-blur-sm rounded-none p-3 border border-white/20 mb-6">
                    <span className="text-white font-light">Web Browser</span>
                  </div>
                  
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-light text-white mb-2">Ready to Use</h4>
                    <p className="text-gray-400 font-light text-sm">
                      No download required
                    </p>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onShowLogin}
                    className="w-full px-6 py-3 bg-white text-black rounded-none font-light hover:bg-gray-100 transition-all duration-300 border border-white"
                  >
                    <span>Start Using Web App</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </section>

         

         {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 text-center">
                       <motion.div
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 1.8 }}
               className="max-w-2xl mx-auto"
             >
               <h2 className="text-4xl md:text-5xl font-light text-white mb-6 tracking-wide">
                 Get Started Now
               </h2>
               <p className="text-xl text-gray-400 mb-8 font-light">
                 Join our community and start connecting today.
               </p>
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={onShowLogin}
                 className="px-10 py-3 bg-white text-black rounded-none font-light text-xl hover:bg-gray-100 transition-all duration-300 flex items-center space-x-3 mx-auto border border-white"
               >
                 <span>Sign Up Free</span>
                 <ArrowRight className="w-5 h-5" />
               </motion.button>
             </motion.div>
        </section>

                 {/* Footer */}
         <footer className="container mx-auto px-4 py-12 text-center">
           <div className="text-gray-500 text-sm font-light">
             <p>&copy; 2024 CHATLI. All rights reserved.</p>
                      </div>
         </footer>
       </div>

       {/* Contact Modal */}
       {showContactModal && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
           onClick={() => setShowContactModal(false)}
         >
           <motion.div
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.9, opacity: 0 }}
             className="bg-black border border-white/20 rounded-none p-8 max-w-md w-full"
             onClick={(e) => e.stopPropagation()}
           >
             <div className="text-center">
               <h3 className="text-2xl font-light text-white mb-4 tracking-wide">
                 Join Beta Test
               </h3>
               <p className="text-gray-400 font-light mb-6">
                 Contact us to join the exclusive beta test
               </p>
               <div className="bg-white/10 backdrop-blur-sm rounded-none p-4 border border-white/20 mb-6">
                 <span className="text-white font-light text-lg">omnivyse@gmail.com</span>
               </div>
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => {
                   navigator.clipboard.writeText('omnivyse@gmail.com');
                   setShowContactModal(false);
                 }}
                 className="w-full px-6 py-3 bg-white text-black rounded-none font-light hover:bg-gray-100 transition-all duration-300 border border-white mb-4"
               >
                 <span>Copy Email</span>
               </motion.button>
               <button
                 onClick={() => setShowContactModal(false)}
                 className="text-gray-400 font-light hover:text-white transition-colors"
               >
                 Close
               </button>
             </div>
           </motion.div>
         </motion.div>
       )}
     </div>
   );
 };

export default Introduction; 