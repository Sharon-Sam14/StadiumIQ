# Oracle Cloud Always Free Tier Setup Manual

This document provides step-by-step instructions for creating a free Ubuntu VM, configuring Virtual Cloud Networks (VCN), opening security lists, and mapping firewall rules inside Oracle Cloud Infrastructure (OCI).

---

## ☁️ Step 1: Create an Oracle Cloud Account
1. Visit [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2. Click **Start for Free** and register your account.
3. Complete authentication (requires a credit card for identity verification; no charges will occur under the Free Tier limits).

---

## 🖥️ Step 2: Create a Compute VM Instance
1. Log in to the OCI Console.
2. Open the main navigation menu and select **Compute** > **Instances**.
3. Click **Create Instance**.
4. Configure the following parameters:
   - **Name**: `stadiumiq-production-host`
   - **Compartment**: Select default root compartment.
   - **Placement (Availability Domain)**: Choose any default AD.
   - **Security**: Default Shielded Instance.
   - **Image and Shape**:
     - **Image**: `Canonical Ubuntu 24.04 LTS` (Click *Change Image* to select).
     - **Shape**: `VM.Standard.E4.Flex` (AMD) or `VM.Standard.A1.Flex` (Ampere ARM). *Ampere ARM shapes allow up to 4 OCPUs and 24 GB of RAM for free.*
   - **Networking (Virtual Cloud Network)**:
     - Select **Create a new virtual cloud network (VCN)**.
     - Select **Create a new public subnet**.
     - Check **Assign a public IPv4 address** to ensure the VM is reachable.
   - **Add SSH keys**:
     - Select **Generate a key pair for me**.
     - Click **Save Private Key** (Keep this secure; it is required to connect to the VM!).
   - **Boot Volume**:
     - Select default size (minimum 47 GB up to 200 GB is free).
5. Click **Create** at the bottom.
6. Wait for the Instance status to show **RUNNING**. Copy the **Public IP Address**.

---

## 🔒 Step 3: Configure Virtual Cloud Network (VCN) Firewall
By default, OCI blocks all incoming traffic except SSH (port 22). We must configure the VCN Security Lists to permit web traffic on port 80 and 443.

1. In the Compute Instance details page, locate the **Primary VNIC** section and click on the **Subnet** link.
2. Click on the **Default Security List** for the subnet.
3. Click **Add Ingress Rules**.
4. Add the following rules:

#### Rule 1: HTTP Ingress
- **Source Type**: `CIDR`
- **Source CIDR**: `0.0.0.0/0`
- **IP Protocol**: `TCP`
- **Source Port Range**: `All`
- **Destination Port Range**: `80`
- **Description**: Allow inbound HTTP traffic for Certbot / Let's Encrypt validation.

#### Rule 2: HTTPS Ingress
- **Source Type**: `CIDR`
- **Source CIDR**: `0.0.0.0/0`
- **IP Protocol**: `TCP`
- **Source Port Range**: `All`
- **Destination Port Range**: `443`
- **Description**: Allow inbound HTTPS traffic for secure user API Gateway queries.

5. Click **Add Ingress Rules**.

---

## 🔑 Step 4: Access Your VM via SSH
Change permissions of the downloaded private key file (`ssh-key.key`) and connect to your VM:

On Linux / MacOS:
```bash
chmod 400 ssh-key.key
ssh -i ssh-key.key ubuntu@YOUR_VM_PUBLIC_IP
```

On Windows (PowerShell):
```powershell
# Set strict file permissions on the key
icacls.exe .\ssh-key.key /inheritance:r /grant:r "$($env:USERNAME):(R)"
ssh -i .\ssh-key.key ubuntu@YOUR_VM_PUBLIC_IP
```

Once connected, you will see the Ubuntu welcome message. You are now ready to begin the Docker environment deployment.
